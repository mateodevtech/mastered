import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, tasks } from "@/lib/db/schema";

export type CalendarTask = {
  id: string;
  title: string;
  deadline: Date;
  status: string;
  notificationMode: string;
  requiresProof: boolean;
  goalId: string;
  goalTitle: string;
  goalType: string;
};

export async function getTasksInRangeForUser(
  userId: string,
  start: Date,
  end: Date,
): Promise<CalendarTask[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      deadline: tasks.deadline,
      status: tasks.status,
      notificationMode: tasks.notificationMode,
      requiresProof: tasks.requiresProof,
      goalId: tasks.goalId,
      goalTitle: goals.title,
      goalType: goals.type,
    })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(and(eq(goals.ownerId, userId), gte(tasks.deadline, start), lt(tasks.deadline, end)))
    .orderBy(asc(tasks.deadline));

  return rows;
}
