import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { TaskRow } from "@/components/tasks/task-row";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const task = await getTaskById(taskId);
  if (!task) notFound();

  const goal = await getGoalForUser(task.goalId, user.id);
  if (!goal) notFound();

  return (
    <main className="flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <Link
        href={`/goals/${goal.id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {goal.title}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
      <TaskRow task={task} />
    </main>
  );
}
