import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { createTaskSchema } from "@/lib/validators/tasks";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const goal = await getGoalForUser(parsed.data.goalId, user.id);
  if (!goal) return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });

  const { goalId, title, deadline, notificationMode, isCriticalCommitment, requiresProof, proofType } =
    parsed.data;

  const [task] = await db
    .insert(tasks)
    .values({
      goalId,
      title,
      deadline: new Date(deadline),
      notificationMode,
      isCriticalCommitment,
      requiresProof,
      proofType: requiresProof ? proofType : null,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
