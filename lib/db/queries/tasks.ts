import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, tasks } from "@/lib/db/schema";

export async function listTasksForGoal(goalId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.goalId, goalId),
    orderBy: [asc(tasks.deadline)],
  });
}

export async function listTasksForUser(userId: string) {
  return db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(goals, eq(tasks.goalId, goals.id))
    .where(eq(goals.ownerId, userId))
    .orderBy(asc(tasks.deadline))
    .then((rows) => rows.map((r) => r.task));
}

export async function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
}
