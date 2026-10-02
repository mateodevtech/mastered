import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";

export async function listGoalsForUser(userId: string) {
  return db.query.goals.findMany({
    where: eq(goals.ownerId, userId),
    orderBy: [desc(goals.createdAt)],
  });
}

export async function getGoalForUser(goalId: string, userId: string) {
  return db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.ownerId, userId)),
  });
}
