import { NextResponse } from "next/server";
import { requireApiKeyUserId } from "@/lib/auth/require-api-key";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";

export async function GET(
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

  return NextResponse.json(task);
}
