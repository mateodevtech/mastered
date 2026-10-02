import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { listTasksForGoal } from "@/lib/db/queries/tasks";
import { getVeilleurRelationshipForGoal } from "@/lib/db/queries/veilleur";
import { getBadgesForGoal, getStreakForGoal } from "@/lib/db/queries/streaks";
import { GoalTypeBadge } from "@/components/goals/goal-type-label";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { InviteVeilleurDialog } from "@/components/veilleur/invite-veilleur-dialog";
import { StreakBadge } from "@/components/goals/streak-badge";
import { BadgeList } from "@/components/goals/badge-list";
import { Badge } from "@/components/ui/badge";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const goal = await getGoalForUser(goalId, user.id);
  if (!goal) notFound();

  const [tasks, veilleur, streak, goalBadges] = await Promise.all([
    listTasksForGoal(goal.id),
    getVeilleurRelationshipForGoal(goal.id),
    goal.type === "recurring" ? getStreakForGoal(goal.id) : null,
    getBadgesForGoal(goal.id),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
          <GoalTypeBadge type={goal.type} />
          {streak && <StreakBadge streak={streak} />}
        </div>
        {goal.description && <p className="text-muted-foreground">{goal.description}</p>}
        <BadgeList badges={goalBadges} />
        {goal.deadline && (
          <p className="text-sm text-muted-foreground">
            Échéance : {new Date(goal.deadline).toLocaleString("fr-FR")}
          </p>
        )}
        {goal.customRewardText && (
          <p className="text-sm text-muted-foreground">
            Récompense : {goal.customRewardText}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Veilleur</h2>
        {veilleur?.status === "active" ? (
          <>
            <Badge variant="secondary">{veilleur.invitedEmail}</Badge>
            <Link
              href={`/veilleur/goal/${goal.id}`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Voir sa vue
            </Link>
          </>
        ) : veilleur?.status === "pending" ? (
          <Badge variant="outline">Invitation envoyée à {veilleur.invitedEmail}</Badge>
        ) : (
          <InviteVeilleurDialog goalId={goal.id} />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Tâches</h2>
          <NewTaskDialog goalId={goal.id} />
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune tâche pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
