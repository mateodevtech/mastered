import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { consumeMagicLinkToken, findOrCreateUserByEmail } from "@/lib/auth/magic-link";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { veilleurRelationships } from "@/lib/db/schema";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const formData = await request.formData();
  const token = formData.get("token");

  if (typeof token !== "string") {
    return NextResponse.redirect(new URL("/login?error=missing_token", origin));
  }

  const record = await consumeMagicLinkToken(token);
  if (!record || record.purpose !== "veilleur_invite" || !record.relatedGoalId) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", origin));
  }

  const user = await findOrCreateUserByEmail(record.email);
  await createSession(user.id);

  await db
    .update(veilleurRelationships)
    .set({ veilleurUserId: user.id, status: "active", acceptedAt: new Date() })
    .where(eq(veilleurRelationships.goalId, record.relatedGoalId));

  return NextResponse.redirect(new URL(`/veilleur/goal/${record.relatedGoalId}`, origin));
}
