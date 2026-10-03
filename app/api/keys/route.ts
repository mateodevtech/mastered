import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generateApiKey, listActiveApiKeysForUser } from "@/lib/auth/api-key";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { createApiKeySchema } from "@/lib/validators/api-keys";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const keys = await listActiveApiKeysForUser(user.id);
  return NextResponse.json(
    keys.map(({ id, name, keyPrefix, lastUsedAt, createdAt }) => ({
      id,
      name,
      keyPrefix,
      lastUsedAt,
      createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const generated = generateApiKey();
  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name: parsed.data.name,
      keyHash: generated.hash,
      keyPrefix: generated.prefix,
    })
    .returning({ id: apiKeys.id, name: apiKeys.name, createdAt: apiKeys.createdAt });

  // The raw key is returned exactly once — it cannot be retrieved again
  // after this response, only its hash is persisted.
  return NextResponse.json({ ...created, key: generated.raw }, { status: 201 });
}
