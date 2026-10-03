import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, streaks, tasks } from "@/lib/db/schema";

export type ExportTaskRow = {
  goalTitle: string;
  goalType: string;
  taskTitle: string;
  taskStatus: string;
  deadline: Date;
  requiresProof: boolean;
};

export type ExportGoalSummary = {
  goalId: string;
  title: string;
  type: string;
  status: string;
  createdAt: Date;
  deadline: Date | null;
  totalTasks: number;
  doneTasks: number;
  currentStreak: number;
  longestStreak: number;
};

export async function getExportTasksForUser(userId: string): Promise<ExportTaskRow[]> {
  const rows = await db
    .select({
      goalTitle: goals.title,
      goalType: goals.type,
      taskTitle: tasks.title,
      taskStatus: tasks.status,
      deadline: tasks.deadline,
      requiresProof: tasks.requiresProof,
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(eq(goals.ownerId, userId))
    .orderBy(tasks.deadline);

  return rows;
}

export async function getExportGoalSummariesForUser(
  userId: string,
): Promise<ExportGoalSummary[]> {
  const rows = await db
    .select({
      goalId: goals.id,
      title: goals.title,
      type: goals.type,
      status: goals.status,
      createdAt: goals.createdAt,
      deadline: goals.deadline,
    })
    .from(goals)
    .where(eq(goals.ownerId, userId));

  const [taskCounts, streakRows] = await Promise.all([
    db
      .select({ goalId: tasks.goalId, status: tasks.status })
      .from(tasks)
      .innerJoin(goals, eq(tasks.goalId, goals.id))
      .where(eq(goals.ownerId, userId)),
    db
      .select({ streak: streaks })
      .from(streaks)
      .innerJoin(goals, eq(streaks.goalId, goals.id))
      .where(eq(goals.ownerId, userId)),
  ]);

  const streakByGoal = new Map(streakRows.map((r) => [r.streak.goalId, r.streak]));

  const totalsByGoal = new Map<string, { total: number; done: number }>();
  for (const row of taskCounts) {
    const entry = totalsByGoal.get(row.goalId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (row.status === "done") entry.done += 1;
    totalsByGoal.set(row.goalId, entry);
  }

  return rows.map((goal) => {
    const totals = totalsByGoal.get(goal.goalId) ?? { total: 0, done: 0 };
    const streak = streakByGoal.get(goal.goalId);
    return {
      ...goal,
      totalTasks: totals.total,
      doneTasks: totals.done,
      currentStreak: streak?.currentCount ?? 0,
      longestStreak: streak?.longestCount ?? 0,
    };
  });
}
