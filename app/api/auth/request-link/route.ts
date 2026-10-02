import { NextResponse } from "next/server";
import { requestLinkSchema } from "@/lib/validators/auth";
import { createMagicLinkToken, findOrCreateUserByEmail } from "@/lib/auth/magic-link";
import { sendLoginEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestLinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // Always respond the same way whether or not the account already existed,
  // to avoid leaking which emails have accounts.
  await findOrCreateUserByEmail(email);
  const rawToken = await createMagicLinkToken(email, { purpose: "login" });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/auth/callback?token=${rawToken}`;

  await sendLoginEmail(email, callbackUrl);

  return NextResponse.json({ ok: true });
}
