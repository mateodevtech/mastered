import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listGoalsForUser } from "@/lib/db/queries/goals";
import { getGoalProgressForUser } from "@/lib/db/queries/dashboard";
import { getStreaksForUser } from "@/lib/db/queries/streaks";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/goal-card";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [goalsList, progress, streaks] = await Promise.all([
    listGoalsForUser(user.id),
    getGoalProgressForUser(user.id),
    getStreaksForUser(user.id),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tes objectifs</h1>
        <Button nativeButton={false} render={<Link href="/goals/new" />}>
          Nouvel objectif
        </Button>
      </div>

      {goalsList.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun objectif pour l&apos;instant. Crée le premier pour commencer.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalsList.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress.get(goal.id) ?? { total: 0, done: 0 }}
              streak={streaks.get(goal.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
