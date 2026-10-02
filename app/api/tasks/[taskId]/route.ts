import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { resolveRepairWindowOnCompletion } from "@/lib/db/queries/streaks";
import { updateTaskSchema } from "@/lib/validators/tasks";

async function assertOwnership(taskId: string, userId: string) {
  const task = await getTaskById(taskId);
  if (!task) return null;
  const goal = await getGoalForUser(task.goalId, userId);
  if (!goal) return null;
  return { task, goal };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { taskId } = await params;
  const owned = await assertOwnership(taskId, user.id);
  if (!owned) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json(owned.task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { taskId } = await params;
  const owned = await assertOwnership(taskId, user.id);
  if (!owned) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const { task, goal } = owned;

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  if (parsed.data.status === "done" && task.requiresProof) {
    return NextResponse.json(
      {
        error:
          "Cette tâche nécessite une preuve — la soumission de preuve arrive avec l'alarme bloquante (M5).",
      },
      { status: 400 },
    );
  }

  const { deadline, ...rest } = parsed.data;
  const [updated] = await db
    .update(tasks)
    .set({
      ...rest,
      ...(deadline ? { deadline: new Date(deadline) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (parsed.data.status === "done" && goal.type === "recurring") {
    await resolveRepairWindowOnCompletion(goal.id, user.id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { taskId } = await params;
  const owned = await assertOwnership(taskId, user.id);
  if (!owned) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.delete(tasks).where(eq(tasks.id, taskId));
  return NextResponse.json({ ok: true });
}
