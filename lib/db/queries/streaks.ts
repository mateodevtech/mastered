import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { badges, goals, streaks } from "@/lib/db/schema";
import { crossesBadgeThreshold } from "@/lib/streaks/grace";

export async function getStreakForGoal(goalId: string) {
  return db.query.streaks.findFirst({ where: eq(streaks.goalId, goalId) });
}

export async function getStreaksForUser(userId: string) {
  const rows = await db
    .select({ streak: streaks })
    .from(streaks)
    .innerJoin(goals, eq(streaks.goalId, goals.id))
    .where(eq(goals.ownerId, userId));

  return new Map(rows.map((r) => [r.streak.goalId, r.streak]));
}

export async function getBadgesForGoal(goalId: string) {
  return db.query.badges.findMany({ where: eq(badges.goalId, goalId) });
}

export async function getOrCreateStreak(goalId: string) {
  const existing = await db.query.streaks.findFirst({ where: eq(streaks.goalId, goalId) });
  if (existing) return existing;

  const [created] = await db.insert(streaks).values({ goalId }).returning();
  return created;
}

async function awardBadgeIfNew(userId: string, goalId: string, count: number) {
  if (!crossesBadgeThreshold(count)) return;
  const label = `streak-${count}`;

  const existing = await db.query.badges.findFirst({
    where: and(eq(badges.goalId, goalId), eq(badges.label, label)),
  });
  if (existing) return;

  await db.insert(badges).values({ userId, goalId, type: "streak_milestone", label });
}

// Called from a task-completion path for a recurring goal: if a repair
// window is currently open, completing a qualifying task resolves it
// immediately rather than waiting for the next nightly cron run.
export async function resolveRepairWindowOnCompletion(goalId: string, userId: string) {
  const streak = await getOrCreateStreak(goalId);
  const now = new Date();
  if (!streak.repairWindowExpiresAt || streak.repairWindowExpiresAt.getTime() < now.getTime()) {
    return;
  }

  const newCount = streak.currentCount + 1;

  await db
    .update(streaks)
    .set({
      currentCount: newCount,
      longestCount: Math.max(streak.longestCount, newCount),
      lastCompletedAt: now,
      repairWindowExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(streaks.id, streak.id));

  await awardBadgeIfNew(userId, goalId, newCount);
}

export { awardBadgeIfNew };
