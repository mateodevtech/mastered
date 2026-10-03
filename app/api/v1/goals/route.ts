import { NextResponse } from "next/server";
import { requireApiKeyUserId } from "@/lib/auth/require-api-key";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { listGoalsForUser } from "@/lib/db/queries/goals";
import { createGoalSchema } from "@/lib/validators/goals";

export async function GET(request: Request) {
  const userId = await requireApiKeyUserId(request);
  if (userId instanceof NextResponse) return userId;

  const rows = await listGoalsForUser(userId);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const userId = await requireApiKeyUserId(request);
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const { title, description, type, deadline, recurrenceTimesPerWeek, customRewardText } =
    parsed.data;

  const [goal] = await db
    .insert(goals)
    .values({
      ownerId: userId,
      title,
      description,
      type,
      deadline: type === "one_off" && deadline ? new Date(deadline) : null,
      recurrenceRule:
        type === "recurring" ? { timesPerWeek: recurrenceTimesPerWeek } : null,
      customRewardText,
    })
    .returning();

  return NextResponse.json(goal, { status: 201 });
}
