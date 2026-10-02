import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

export async function listTasksForGoal(goalId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.goalId, goalId),
    orderBy: [asc(tasks.deadline)],
  });
}

export async function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
}
