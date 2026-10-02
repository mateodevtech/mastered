import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, notificationLog, tasks, users, veilleurRelationships } from "@/lib/db/schema";
import { sendPushToUser } from "@/lib/push/send";
import { sendVeilleurMissedDeadlineEmail } from "@/lib/email";

// Triggered by Vercel Cron in production (see vercel.json) — guarded by
// CRON_SECRET so it can't be triggered publicly.
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // --- Normal reminders: one-shot, deduped via notificationLog ---
  const normalDue = await db
    .select({ task: tasks, ownerId: goals.ownerId, goalTitle: goals.title })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(
      and(
        eq(tasks.status, "pending"),
        eq(tasks.notificationMode, "normal"),
        lte(tasks.deadline, now),
      ),
    );

  let normalSent = 0;

  for (const { task, ownerId, goalTitle } of normalDue) {
    const alreadyNotified = await db.query.notificationLog.findFirst({
      where: and(
        eq(notificationLog.taskId, task.id),
        eq(notificationLog.type, "normal_reminder"),
      ),
    });
    if (alreadyNotified) continue;

    await sendPushToUser(ownerId, {
      taskId: task.id,
      goalId: task.goalId,
      title: `${goalTitle} — ${task.title}`,
      mode: "normal",
      deadline: task.deadline.toISOString(),
    });

    await db.insert(notificationLog).values({
      userId: ownerId,
      taskId: task.id,
      type: "normal_reminder",
    });
    normalSent++;
  }

  // --- Blocking alarms: resent every sweep while unresolved, relying on
  // the service worker's tag+renotify to coalesce client-side rather than
  // deduping server-side. ---
  const blockingDue = await db
    .select({ task: tasks, ownerId: goals.ownerId, goalTitle: goals.title })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(
      and(
        eq(tasks.status, "pending"),
        eq(tasks.notificationMode, "blocking"),
        lte(tasks.deadline, now),
      ),
    );

  let blockingSent = 0;

  for (const { task, ownerId, goalTitle } of blockingDue) {
    await sendPushToUser(ownerId, {
      taskId: task.id,
      goalId: task.goalId,
      title: `${goalTitle} — ${task.title}`,
      mode: "blocking",
      deadline: task.deadline.toISOString(),
    });
    await db.insert(notificationLog).values({
      userId: ownerId,
      taskId: task.id,
      type: "blocking_alarm",
    });
    blockingSent++;
  }

  // --- Veilleur missed-deadline email: one-shot per task, any overdue
  // pending task whose goal has an active Veilleur. ---
  const overdueWithVeilleur = await db
    .select({
      task: tasks,
      goalTitle: goals.title,
      ownerName: users.displayName,
      ownerEmail: users.email,
      veilleurEmail: veilleurRelationships.invitedEmail,
      veilleurUserId: veilleurRelationships.veilleurUserId,
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .innerJoin(users, eq(goals.ownerId, users.id))
    .innerJoin(veilleurRelationships, eq(veilleurRelationships.goalId, goals.id))
    .where(
      and(
        eq(tasks.status, "pending"),
        eq(veilleurRelationships.status, "active"),
        lte(tasks.deadline, now),
      ),
    );

  let veilleurNotified = 0;

  for (const row of overdueWithVeilleur) {
    const alreadyNotified = await db.query.notificationLog.findFirst({
      where: and(
        eq(notificationLog.taskId, row.task.id),
        eq(notificationLog.type, "veilleur_missed_deadline"),
      ),
    });
    if (alreadyNotified || !row.veilleurUserId) continue;

    await sendVeilleurMissedDeadlineEmail(
      row.veilleurEmail,
      row.ownerName ?? row.ownerEmail,
      row.goalTitle,
      row.task.title,
    );

    await db.insert(notificationLog).values({
      userId: row.veilleurUserId,
      taskId: row.task.id,
      type: "veilleur_missed_deadline",
    });
    veilleurNotified++;
  }

  return NextResponse.json({
    ok: true,
    normalSent,
    blockingSent,
    veilleurNotified,
    checked: normalDue.length + blockingDue.length,
  });
}
