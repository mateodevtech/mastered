import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notificationLog, tasks } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { snoozeSchema } from "@/lib/validators/proof";

// The "honest exit" from a blocking alarm: reschedule rather than force a
// silent pass/fail. Resets status to pending and clears prior notification
// log rows so the deadline sweep treats the new deadline as unnotified.
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

  const body = await request.json().catch(() => null);
  const parsed = snoozeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const newDeadline = new Date(parsed.data.newDeadline);

  await db
    .update(tasks)
    .set({
      deadline: newDeadline,
      snoozedToDeadline: newDeadline,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  await db.delete(notificationLog).where(eq(notificationLog.taskId, task.id));

  return NextResponse.json({ ok: true });
}
