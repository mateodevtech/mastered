import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { hashToken } from "./tokens";

const KEY_PREFIX = "mk_live_";

export type GeneratedApiKey = {
  raw: string;
  hash: string;
  prefix: string;
};

export function generateApiKey(): GeneratedApiKey {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  return {
    raw,
    hash: hashToken(raw),
    // Shown in the list UI so the user can tell keys apart without ever
    // seeing the full secret again.
    prefix: raw.slice(0, KEY_PREFIX.length + 6),
  };
}

export async function getUserIdFromApiKey(rawKey: string): Promise<string | null> {
  const keyHash = hashToken(rawKey);
  const record = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });
  if (!record || record.revokedAt) return null;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id));
  return record.userId;
}

export async function getUserFromApiKeyRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey) return null;
  return getUserIdFromApiKey(rawKey);
}

export async function listActiveApiKeysForUser(userId: string) {
  return db.query.apiKeys.findMany({
    where: and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)),
    orderBy: [desc(apiKeys.createdAt)],
  });
}
