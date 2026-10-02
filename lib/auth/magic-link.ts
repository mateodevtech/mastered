import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { magicLinkTokens, users } from "@/lib/db/schema";
import { generateToken, hashToken } from "./tokens";

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findOrCreateUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalized),
  });
  if (existing) return existing;

  const [created] = await db.insert(users).values({ email: normalized }).returning();
  return created;
}

export async function createMagicLinkToken(
  email: string,
  options?: { purpose?: "login" | "veilleur_invite"; relatedGoalId?: string },
): Promise<string> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);

  await db.insert(magicLinkTokens).values({
    email: normalizeEmail(email),
    tokenHash,
    purpose: options?.purpose ?? "login",
    relatedGoalId: options?.relatedGoalId,
    expiresAt,
  });

  return rawToken;
}

// Read-only lookup for confirmation screens (e.g. the Veilleur invite
// page) that need to show what a token is for before the user commits —
// consuming happens separately, via consumeMagicLinkToken.
export async function peekMagicLinkToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  return db.query.magicLinkTokens.findFirst({
    where: and(
      eq(magicLinkTokens.tokenHash, tokenHash),
      isNull(magicLinkTokens.consumedAt),
      gt(magicLinkTokens.expiresAt, now),
    ),
  });
}

// Marks the token consumed and returns its row, or null if it's missing,
// expired, or was already used. Single-use by construction.
export async function consumeMagicLinkToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const record = await db.query.magicLinkTokens.findFirst({
    where: and(
      eq(magicLinkTokens.tokenHash, tokenHash),
      isNull(magicLinkTokens.consumedAt),
      gt(magicLinkTokens.expiresAt, now),
    ),
  });
  if (!record) return null;

  await db
    .update(magicLinkTokens)
    .set({ consumedAt: now })
    .where(eq(magicLinkTokens.id, record.id));

  return record;
}
