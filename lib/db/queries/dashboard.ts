import "server-only";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, tasks } from "@/lib/db/schema";

// "Today's tasks" = anything pending due by end of today, including
// anything already overdue — a dashboard should surface what's late, not
// hide it.
export async function getTodayTasksForUser(userId: string) {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      deadline: tasks.deadline,
      status: tasks.status,
      notificationMode: tasks.notificationMode,
      isCriticalCommitment: tasks.isCriticalCommitment,
      requiresProof: tasks.requiresProof,
      proofType: tasks.proofType,
      goalId: tasks.goalId,
      goalTitle: goals.title,
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(
      and(eq(goals.ownerId, userId), eq(tasks.status, "pending"), lte(tasks.deadline, endOfDay)),
    )
    .orderBy(asc(tasks.deadline));
}

export async function getGoalProgressForUser(userId: string) {
  const rows = await db
    .select({
      goalId: tasks.goalId,
      total: sql<number>`count(*)`.mapWith(Number),
      done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(eq(goals.ownerId, userId))
    .groupBy(tasks.goalId);

  return new Map(rows.map((r) => [r.goalId, { total: r.total, done: r.done }]));
}

// Drives the persistent "unresolved alarm" dashboard banner — a user
// shouldn't be able to lose track of a blocking task by navigating away
// from the alarm screen without resolving it.
export async function getActiveBlockingAlarmForUser(userId: string) {
  const now = new Date();

  const rows = await db
    .select({ id: tasks.id, title: tasks.title, goalTitle: goals.title })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(
      and(
        eq(goals.ownerId, userId),
        eq(tasks.status, "pending"),
        eq(tasks.notificationMode, "blocking"),
        lte(tasks.deadline, now),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
