import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { badges, goals, streaks, tasks } from "@/lib/db/schema";
import { getOrCreateStreak } from "@/lib/db/queries/streaks";
import {
  crossesBadgeThreshold,
  decideWeeklyOutcome,
  freezeMonthKey,
  isRepairWindowExpired,
  isSameFreezeMonth,
} from "@/lib/streaks/grace";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

// Triggered once a day by Vercel Cron (see vercel.json) — guarded by
// CRON_SECRET. Evaluates "the week that just ended" for every recurring
// goal, but only on the day that boundary falls on (Monday, UTC) so a
// week is never double-counted.
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const simulateNow = searchParams.get("simulateNow");
  const now =
    simulateNow && process.env.NODE_ENV !== "production" ? new Date(simulateNow) : new Date();
  const isWeekBoundary = now.getUTCDay() === 1; // Monday

  const recurringGoals = await db
    .select({ goal: goals })
    .from(goals)
    .where(and(eq(goals.type, "recurring"), eq(goals.status, "active")));

  let evaluated = 0;
  let frozen = 0;
  let repairOpened = 0;
  let reset = 0;
  let badgesAwarded = 0;

  for (const { goal } of recurringGoals) {
    const streak = await getOrCreateStreak(goal.id);
    const monthKey = freezeMonthKey(now);
    const freezesUsedThisMonth = isSameFreezeMonth(streak.freezeMonthAnchor, now)
      ? streak.freezesUsedThisMonth
      : 0;

    // An expired, unresolved repair window means the miss stands.
    if (isRepairWindowExpired(streak.repairWindowExpiresAt, now)) {
      await db
        .update(streaks)
        .set({
          currentCount: 0,
          repairWindowExpiresAt: null,
          freezesUsedThisMonth,
          freezeMonthAnchor: monthKey,
          updatedAt: now,
        })
        .where(eq(streaks.id, streak.id));
      reset++;
      await triggerWebhookEvent(goal.ownerId, "streak.broken", {
        goalId: goal.id,
        goalTitle: goal.title,
        previousCount: streak.currentCount,
      });
      continue;
    }

    if (!isWeekBoundary) {
      if (freezesUsedThisMonth !== streak.freezesUsedThisMonth) {
        await db
          .update(streaks)
          .set({ freezesUsedThisMonth, freezeMonthAnchor: monthKey, updatedAt: now })
          .where(eq(streaks.id, streak.id));
      }
      continue;
    }

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setUTCHours(0, 0, 0, 0);

    const completed = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.goalId, goal.id),
          eq(tasks.status, "done"),
          gte(tasks.deadline, weekStart),
          lt(tasks.deadline, weekEnd),
        ),
      );

    const timesPerWeek =
      (goal.recurrenceRule as { timesPerWeek?: number } | null)?.timesPerWeek ?? 1;

    const decision = decideWeeklyOutcome({
      met: completed.length >= timesPerWeek,
      currentCount: streak.currentCount,
      freezesUsedThisMonth,
      hasOpenRepairWindow: streak.repairWindowExpiresAt !== null,
    });
    evaluated++;

    if (decision.kind === "success") {
      await db
        .update(streaks)
        .set({
          currentCount: decision.newCount,
          longestCount: Math.max(streak.longestCount, decision.newCount),
          lastCompletedAt: now,
          repairWindowExpiresAt: null,
          freezesUsedThisMonth,
          freezeMonthAnchor: monthKey,
          updatedAt: now,
        })
        .where(eq(streaks.id, streak.id));

      if (crossesBadgeThreshold(decision.newCount)) {
        const label = `streak-${decision.newCount}`;
        const existingBadge = await db.query.badges.findFirst({
          where: and(eq(badges.goalId, goal.id), eq(badges.label, label)),
        });
        if (!existingBadge) {
          await db.insert(badges).values({
            userId: goal.ownerId,
            goalId: goal.id,
            type: "streak_milestone",
            label,
          });
          badgesAwarded++;
          await triggerWebhookEvent(goal.ownerId, "streak.milestone", {
            goalId: goal.id,
            goalTitle: goal.title,
            streakCount: decision.newCount,
          });
        }
      }
    } else if (decision.kind === "freeze") {
      await db
        .update(streaks)
        .set({
          freezesUsedThisMonth: decision.freezesUsedThisMonth,
          freezeMonthAnchor: monthKey,
          updatedAt: now,
        })
        .where(eq(streaks.id, streak.id));
      frozen++;
    } else if (decision.kind === "open_repair") {
      const repairWindowExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db
        .update(streaks)
        .set({
          repairWindowExpiresAt,
          freezesUsedThisMonth,
          freezeMonthAnchor: monthKey,
          updatedAt: now,
        })
        .where(eq(streaks.id, streak.id));
      repairOpened++;
    }
  }

  return NextResponse.json({
    ok: true,
    totalRecurringGoals: recurringGoals.length,
    evaluated,
    frozen,
    repairOpened,
    reset,
    badgesAwarded,
  });
}
