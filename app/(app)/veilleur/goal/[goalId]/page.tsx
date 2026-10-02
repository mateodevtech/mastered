import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getVeilleurAccessibleGoal, getProofsAwaitingReview } from "@/lib/db/queries/veilleur";
import { listTasksForGoal } from "@/lib/db/queries/tasks";
import { GoalTypeBadge } from "@/components/goals/goal-type-label";
import { Badge } from "@/components/ui/badge";
import { ProofReviewCard } from "@/components/veilleur/proof-review-card";

export default async function VeilleurGoalPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const access = await getVeilleurAccessibleGoal(goalId, user.id);
  if (!access) notFound();

  const { goal } = access;
  const [tasks, awaitingReview] = await Promise.all([
    listTasksForGoal(goal.id),
    getProofsAwaitingReview(goal.id),
  ]);

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
          <GoalTypeBadge type={goal.type} />
        </div>
        {goal.description && <p className="text-muted-foreground">{goal.description}</p>}
        <p className="text-sm text-muted-foreground">
          {doneCount}/{tasks.length} tâches accomplies
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">À examiner</h2>
        {awaitingReview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune preuve en attente de ta réponse.</p>
        ) : (
          <div className="flex flex-col rounded-lg border px-4">
            {awaitingReview.map(({ proof, task }) => (
              <ProofReviewCard
                key={proof.id}
                proofId={proof.id}
                taskTitle={task.title}
                proofType={proof.type}
                textContent={proof.textContent}
                photoUrl={proof.photoUrl}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Toutes les tâches</h2>
        <div className="flex flex-col">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
              <span className={task.status === "done" ? "text-muted-foreground line-through" : ""}>
                {task.title}
              </span>
              <Badge variant={task.status === "done" ? "secondary" : "outline"}>
                {task.status === "done" ? "Fait" : "En cours"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
