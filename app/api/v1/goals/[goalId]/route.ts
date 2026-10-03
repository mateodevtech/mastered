import { NextResponse } from "next/server";
import { requireApiKeyUserId } from "@/lib/auth/require-api-key";
import { getGoalForUser } from "@/lib/db/queries/goals";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const userId = await requireApiKeyUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { goalId } = await params;
  const goal = await getGoalForUser(goalId, userId);
  if (!goal) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json(goal);
}
