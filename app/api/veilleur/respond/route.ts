import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { goals, proofs, tasks, users, veilleurRelationships, veilleurResponses } from "@/lib/db/schema";
import { veilleurRespondSchema } from "@/lib/validators/veilleur";
import { sendVeilleurResponseEmail } from "@/lib/email";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = veilleurRespondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const proof = await db.query.proofs.findFirst({ where: eq(proofs.id, parsed.data.proofId) });
  if (!proof) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, proof.taskId) });
  if (!task) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const goal = await db.query.goals.findFirst({ where: eq(goals.id, task.goalId) });
  if (!goal) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const relationship = await db.query.veilleurRelationships.findFirst({
    where: eq(veilleurRelationships.goalId, task.goalId),
  });
  if (
    !relationship ||
    relationship.veilleurUserId !== user.id ||
    relationship.status !== "active"
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { action, note, proofId } = parsed.data;

  await db.insert(veilleurResponses).values({
    proofId,
    veilleurUserId: user.id,
    action,
    note,
    newDeadline: action === "extend" ? new Date(parsed.data.newDeadline) : null,
  });

  if (action === "extend") {
    await db
      .update(tasks)
      .set({ deadline: new Date(parsed.data.newDeadline), status: "pending", updatedAt: new Date() })
      .where(eq(tasks.id, task.id));
  }

  if (action === "nudge" || action === "encourage" || action === "extend") {
    const owner = await db.query.users.findFirst({ where: eq(users.id, goal.ownerId) });
    if (owner) {
      await sendVeilleurResponseEmail(
        owner.email,
        user.displayName ?? user.email,
        action,
        task.title,
        note,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
