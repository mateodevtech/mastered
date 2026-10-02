import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, proofs, tasks, veilleurRelationships, veilleurResponses } from "@/lib/db/schema";

export async function getVeilleurRelationshipForGoal(goalId: string) {
  return db.query.veilleurRelationships.findFirst({
    where: eq(veilleurRelationships.goalId, goalId),
  });
}

// Access check for the Veilleur-facing goal view: the goal owner can
// always see it, otherwise only the goal's active Veilleur can.
export async function getVeilleurAccessibleGoal(goalId: string, userId: string) {
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) });
  if (!goal) return null;

  if (goal.ownerId === userId) return { goal, isOwner: true as const };

  const relationship = await db.query.veilleurRelationships.findFirst({
    where: and(
      eq(veilleurRelationships.goalId, goalId),
      eq(veilleurRelationships.veilleurUserId, userId),
      eq(veilleurRelationships.status, "active"),
    ),
  });
  if (!relationship) return null;

  return { goal, isOwner: false as const };
}

// Proofs for this goal's tasks that have no veilleurResponses row yet —
// the review queue.
export async function getProofsAwaitingReview(goalId: string) {
  return db
    .select({ proof: proofs, task: tasks })
    .from(proofs)
    .innerJoin(tasks, eq(proofs.taskId, tasks.id))
    .leftJoin(veilleurResponses, eq(veilleurResponses.proofId, proofs.id))
    .where(and(eq(tasks.goalId, goalId), isNull(veilleurResponses.id)));
}
