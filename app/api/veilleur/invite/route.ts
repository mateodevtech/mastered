import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoalForUser } from "@/lib/db/queries/goals";
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

  // A goal can have several Veilleurs, but never two invitations to the
  // same email — re-inviting an email just refreshes its existing row.
  const existing = await db.query.veilleurRelationships.findFirst({
    where: and(
      eq(veilleurRelationships.goalId, goal.id),
      eq(veilleurRelationships.invitedEmail, parsed.data.email),
    ),
  });

  if (existing?.status === "active") {
    return NextResponse.json(
      { error: "Cette personne est déjà Veilleur actif sur cet objectif" },
      { status: 400 },
    );
  }

  if (existing) {
    await db
      .update(veilleurRelationships)
      .set({ invitedAt: new Date() })
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
