import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { ensureConfigured, webpush } from "./vapid";

export type PushPayload = {
  taskId: string;
  goalId: string;
  title: string;
  mode: "normal" | "blocking";
  deadline: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();

  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ),
    ),
  );

  // Prune subscriptions the push service says are gone (unsubscribed,
  // expired) so we stop retrying them on every sweep.
  await Promise.all(
    results.map(async (result, i) => {
      if (result.status !== "rejected") return;
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subs[i].id));
      }
    }),
  );

  return results;
}
