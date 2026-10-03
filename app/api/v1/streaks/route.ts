import { NextResponse } from "next/server";
import { requireApiKeyUserId } from "@/lib/auth/require-api-key";
import { getStreaksForUser } from "@/lib/db/queries/streaks";

export async function GET(request: Request) {
  const userId = await requireApiKeyUserId(request);
  if (userId instanceof NextResponse) return userId;

  const streakByGoal = await getStreaksForUser(userId);
  return NextResponse.json(Array.from(streakByGoal.values()));
}
