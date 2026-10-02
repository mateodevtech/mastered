import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { updateGoalSchema } from "@/lib/validators/goals";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { goalId } = await params;
  const goal = await getGoalForUser(goalId, user.id);
  if (!goal) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json(goal);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { goalId } = await params;
  const existing = await getGoalForUser(goalId, user.id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(goals)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(goals.id, goalId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { goalId } = await params;
  const existing = await getGoalForUser(goalId, user.id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.delete(goals).where(eq(goals.id, goalId));
  return NextResponse.json({ ok: true });
}
