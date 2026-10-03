import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiKeyUserId } from "@/lib/auth/require-api-key";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { resolveRepairWindowOnCompletion } from "@/lib/db/queries/streaks";
import { triggerWebhookEvent } from "@/lib/webhooks/dispatch";

// For tasks that don't require proof. Tasks with requiresProof=true must
// go through the app's proof flow — the API can't accept a photo upload
// correctly without that dedicated route.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const userId = await requireApiKeyUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { taskId } = await params;
  const task = await getTaskById(taskId);
  if (!task) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const goal = await getGoalForUser(task.goalId, userId);
  if (!goal) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (task.requiresProof) {
    return NextResponse.json(
      { error: "Cette tâche nécessite une preuve, utilise l'application pour la compléter." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(tasks.id, task.id))
    .returning();

  if (goal.type === "recurring") {
    await resolveRepairWindowOnCompletion(goal.id, userId);
  }

  await triggerWebhookEvent(userId, "task.completed", {
    taskId: updated.id,
    goalId: goal.id,
    goalTitle: goal.title,
    taskTitle: updated.title,
  });

  return NextResponse.json(updated);
}
