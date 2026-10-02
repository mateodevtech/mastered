import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { createGoalSchema } from "@/lib/validators/goals";
import { listGoalsForUser } from "@/lib/db/queries/goals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await listGoalsForUser(user.id);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
      ownerId: user.id,
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
