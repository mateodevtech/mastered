import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";
import type { webhookEventEnum } from "@/lib/db/schema";
import { signWebhookPayload } from "./signing";

export type WebhookEvent = (typeof webhookEventEnum.enumValues)[number];

const DELIVERY_TIMEOUT_MS = 5000;

// Best-effort, fire-and-forget delivery: a slow or dead receiver must
// never block the request path that triggered the event (e.g. submitting
// a proof). Failures are recorded, not retried — retry queues are a
// follow-up once there's real traffic to justify them.
export async function triggerWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
) {
  const endpoints = await db.query.webhookEndpoints.findMany({
    where: and(eq(webhookEndpoints.userId, userId), eq(webhookEndpoints.isActive, true)),
  });

  const subscribed = endpoints.filter((endpoint) => endpoint.events.includes(event));
  if (subscribed.length === 0) return;

  const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  await Promise.all(subscribed.map((endpoint) => deliver(endpoint.id, endpoint.url, endpoint.secret, event, body)));
}

async function deliver(
  endpointId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  body: string,
) {
  const signature = signWebhookPayload(secret, body);

  let responseStatus: number | null = null;
  let status: "success" | "failed" = "failed";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mastered-Signature": signature,
        "X-Mastered-Event": event,
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    responseStatus = response.status;
    status = response.ok ? "success" : "failed";
  } catch {
    status = "failed";
  }

  await db.insert(webhookDeliveries).values({
    webhookEndpointId: endpointId,
    event,
    payload: JSON.parse(body),
    status,
    responseStatus,
  });
}
