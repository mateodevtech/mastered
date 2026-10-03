import "server-only";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
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

export type DailyCompletion = { date: string; total: number; done: number };

// One bucket per calendar day (user's local date, via deadline truncated
// to day) over the last `days` days, including today — the dashboard
// progression chart reads these buckets directly, no client aggregation.
export async function getDailyCompletionForUser(
  userId: string,
  days: number,
): Promise<DailyCompletion[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`to_char(${tasks.deadline}, 'YYYY-MM-DD')`,
      total: sql<number>`count(*)`.mapWith(Number),
      done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(and(eq(goals.ownerId, userId), gte(tasks.deadline, since)))
    .groupBy(sql`to_char(${tasks.deadline}, 'YYYY-MM-DD')`);

  const byDate = new Map(rows.map((r) => [r.date, r]));
  const buckets: DailyCompletion[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    buckets.push({ date: key, total: bucket?.total ?? 0, done: bucket?.done ?? 0 });
  }
  return buckets;
}

export type TodayCompletion = {
  total: number;
  done: number;
  overdue: number;
  blocking: number;
};

export async function getTodayCompletionForUser(userId: string): Promise<TodayCompletion> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const now = new Date();

  const rows = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(
      and(eq(goals.ownerId, userId), gte(tasks.deadline, startOfDay), lte(tasks.deadline, endOfDay)),
    );

  let done = 0;
  let overdue = 0;
  let blocking = 0;
  for (const { task } of rows) {
    if (task.status === "done") done++;
    if (task.status === "pending" && task.deadline.getTime() < now.getTime()) overdue++;
    if (task.status === "pending" && task.notificationMode === "blocking") blocking++;
  }

  return { total: rows.length, done, overdue, blocking };
}
