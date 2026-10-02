import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getVeilleurRelationshipForGoal } from "@/lib/db/queries/veilleur";
import { db } from "@/lib/db";
import { veilleurRelationships } from "@/lib/db/schema";
import { createMagicLinkToken } from "@/lib/auth/magic-link";
import { sendVeilleurInviteEmail } from "@/lib/email";
import { inviteVeilleurSchema } from "@/lib/validators/veilleur";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = inviteVeilleurSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const goal = await getGoalForUser(parsed.data.goalId, user.id);
  if (!goal) return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });

  const existing = await getVeilleurRelationshipForGoal(goal.id);
  if (existing?.status === "active") {
    return NextResponse.json(
      { error: "Un Veilleur est déjà actif sur cet objectif" },
      { status: 400 },
    );
  }

  if (existing) {
    await db
      .update(veilleurRelationships)
      .set({ invitedEmail: parsed.data.email, invitedAt: new Date() })
      .where(eq(veilleurRelationships.id, existing.id));
  } else {
    await db.insert(veilleurRelationships).values({
      goalId: goal.id,
      invitedEmail: parsed.data.email,
      status: "pending",
    });
  }

  const rawToken = await createMagicLinkToken(parsed.data.email, {
    purpose: "veilleur_invite",
    relatedGoalId: goal.id,
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/veilleur/invite/${rawToken}`;

  await sendVeilleurInviteEmail(
    parsed.data.email,
    inviteUrl,
    user.displayName ?? user.email,
    goal.title,
  );

  return NextResponse.json({ ok: true });
}
