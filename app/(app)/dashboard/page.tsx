import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listGoalsForUser } from "@/lib/db/queries/goals";
import {
  getActiveBlockingAlarmForUser,
  getGoalProgressForUser,
  getTodayTasksForUser,
} from "@/lib/db/queries/dashboard";
import { getStreaksForUser } from "@/lib/db/queries/streaks";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GoalCard } from "@/components/goals/goal-card";
import { TaskRow } from "@/components/tasks/task-row";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [goalsList, todayTasks, progress, activeAlarm, streaks] = await Promise.all([
    listGoalsForUser(user.id),
    getTodayTasksForUser(user.id),
    getGoalProgressForUser(user.id),
    getActiveBlockingAlarmForUser(user.id),
    getStreaksForUser(user.id),
  ]);

  // This Server Component already reads the request-time session cookie
  // via getCurrentUser() above, so it's never statically cached — reading
  // the current time here to flag overdue tasks is safe.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const overdueCount = todayTasks.filter((t) => new Date(t.deadline).getTime() < now).length;

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-8">
      {activeAlarm && (
        <Link
          href={`/alarm/${activeAlarm.id}`}
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/15"
        >
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>
            <strong>{activeAlarm.title}</strong> ({activeAlarm.goalTitle}) attend toujours une
            réponse — reprendre l&apos;alarme.
          </span>
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue{user.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Aujourd&apos;hui</h2>
          {overdueCount > 0 && (
            <Badge variant="destructive">
              {overdueCount} en retard
            </Badge>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Rien de prévu aujourd&apos;hui. Respire, ou avance sur un objectif.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col py-0">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-1 border-b py-3 last:border-b-0">
                  <Link
                    href={`/goals/${task.goalId}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {task.goalTitle}
                  </Link>
                  <TaskRow task={task} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Tes objectifs</h2>
          <Button size="sm" nativeButton={false} render={<Link href="/goals/new" />}>
            Nouvel objectif
          </Button>
        </div>

        {goalsList.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Aucun objectif pour l&apos;instant. Crée le premier pour commencer.
            </CardContent>
          </Card>
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
      </section>
    </main>
  );
}
