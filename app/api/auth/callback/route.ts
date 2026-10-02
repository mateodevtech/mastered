import { NextResponse } from "next/server";
import { consumeMagicLinkToken, findOrCreateUserByEmail } from "@/lib/auth/magic-link";
import { createSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", origin));
  }

  const record = await consumeMagicLinkToken(token);
  if (!record) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", origin));
  }

  const user = await findOrCreateUserByEmail(record.email);
  await createSession(user.id);

  // TODO(M6): when record.purpose === "veilleur_invite", activate the
  // matching veilleurRelationships row and redirect to /veilleur/goal/[id].
  return NextResponse.redirect(new URL("/dashboard", origin));
}
