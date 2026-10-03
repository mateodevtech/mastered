import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { proofs, tasks } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { resolveRepairWindowOnCompletion } from "@/lib/db/queries/streaks";
import { submitProofSchema } from "@/lib/validators/proof";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { taskId } = await params;
  const task = await getTaskById(taskId);
  if (!task) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const goal = await getGoalForUser(task.goalId, user.id);
  if (!goal) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!task.requiresProof) {
    return NextResponse.json(
      { error: "Cette tâche ne nécessite pas de preuve" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = submitProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (parsed.data.type !== task.proofType) {
    return NextResponse.json(
      { error: "Type de preuve incorrect pour cette tâche" },
      { status: 400 },
    );
  }

  const [proof] = await db
    .insert(proofs)
    .values({
      taskId: task.id,
      submittedBy: user.id,
      type: parsed.data.type,
      textContent: parsed.data.type === "text" ? parsed.data.textContent : null,
      photoUrl: parsed.data.type === "photo" ? parsed.data.photoUrl : null,
      checked: parsed.data.type === "checkbox" ? true : null,
    })
    .returning();

  // Submitting proof always clears the task — a Veilleur's review (M6)
  // happens after the fact and is tracked by whether a veilleurResponses
  // row exists for this proof, not by gating task.status.
  await db
    .update(tasks)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(tasks.id, task.id));

  if (goal.type === "recurring") {
    await resolveRepairWindowOnCompletion(goal.id, user.id);
  }

  await triggerWebhookEvent(user.id, "task.completed", {
    taskId: task.id,
    goalId: goal.id,
    goalTitle: goal.title,
    taskTitle: task.title,
  });

  return NextResponse.json({ ok: true, proof });
}
