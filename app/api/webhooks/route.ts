import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { listWebhooksForUser } from "@/lib/db/queries/webhooks";
import { createWebhookSchema } from "@/lib/validators/webhooks";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const webhooks = await listWebhooksForUser(user.id);
  return NextResponse.json(
    webhooks.map(({ id, url, events, isActive, createdAt }) => ({
      id,
      url,
      events,
      isActive,
      createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const secret = "whsec_" + randomBytes(24).toString("base64url");

  const [created] = await db
    .insert(webhookEndpoints)
    .values({
      userId: user.id,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    })
    .returning({ id: webhookEndpoints.id, url: webhookEndpoints.url, events: webhookEndpoints.events });

  // The secret is returned exactly once, to sign payloads client-side —
  // it is stored in the clear server-side only because it must be reused
  // for every future delivery (same tradeoff as Stripe/GitHub webhooks).
  return NextResponse.json({ ...created, secret }, { status: 201 });
}
