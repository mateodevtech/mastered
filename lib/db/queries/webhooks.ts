import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";

export async function listWebhooksForUser(userId: string) {
  return db.query.webhookEndpoints.findMany({
    where: eq(webhookEndpoints.userId, userId),
    orderBy: [desc(webhookEndpoints.createdAt)],
  });
}

export async function getWebhookForUser(webhookId: string, userId: string) {
  return db.query.webhookEndpoints.findFirst({
    where: and(eq(webhookEndpoints.id, webhookId), eq(webhookEndpoints.userId, userId)),
  });
}
