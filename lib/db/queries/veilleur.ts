import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  goals,
  proofs,
  tasks,
  users,
  veilleurRelationships,
  veilleurResponses,
} from "@/lib/db/schema";

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

export type VeilleurSummary = {
  goalId: string;
  goalTitle: string;
  veilleurName: string;
  acceptedAt: Date | null;
  latestNote: string | null;
};

// One active Veilleur relationship to feature on the dashboard — whichever
// the query returns first is fine, a user only has a handful of goals.
export async function getActiveVeilleurSummaryForUser(
  userId: string,
): Promise<VeilleurSummary | null> {
  const rows = await db
    .select({
      goalId: goals.id,
      goalTitle: goals.title,
      invitedEmail: veilleurRelationships.invitedEmail,
      veilleurDisplayName: users.displayName,
      acceptedAt: veilleurRelationships.acceptedAt,
    })
    .from(veilleurRelationships)
    .innerJoin(goals, eq(veilleurRelationships.goalId, goals.id))
    .leftJoin(users, eq(veilleurRelationships.veilleurUserId, users.id))
    .where(and(eq(goals.ownerId, userId), eq(veilleurRelationships.status, "active")))
    .limit(1);

  const relationship = rows[0];
  if (!relationship) return null;

  const latestResponse = await db
    .select({ note: veilleurResponses.note })
    .from(veilleurResponses)
    .innerJoin(proofs, eq(veilleurResponses.proofId, proofs.id))
    .innerJoin(tasks, eq(proofs.taskId, tasks.id))
    .where(eq(tasks.goalId, relationship.goalId))
    .orderBy(desc(veilleurResponses.createdAt))
    .limit(1);

  return {
    goalId: relationship.goalId,
    goalTitle: relationship.goalTitle,
    veilleurName: relationship.veilleurDisplayName ?? relationship.invitedEmail,
    acceptedAt: relationship.acceptedAt,
    latestNote: latestResponse[0]?.note ?? null,
  };
}
