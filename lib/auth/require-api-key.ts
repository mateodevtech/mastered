import "server-only";
import { NextResponse } from "next/server";
import { getUserFromApiKeyRequest } from "./api-key";

export async function requireApiKeyUserId(request: Request): Promise<string | NextResponse> {
  const userId = await getUserFromApiKeyRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Clé API manquante ou invalide. Fournis-la via 'Authorization: Bearer <clé>'." },
      { status: 401 },
    );
  }
  return userId;
}
