import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoalForUser } from "@/lib/db/queries/goals";
import { getTaskById } from "@/lib/db/queries/tasks";
import { AlarmScreen } from "@/components/alarm/alarm-screen";

export default async function AlarmPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const task = await getTaskById(taskId);
  if (!task) notFound();

  const goal = await getGoalForUser(task.goalId, user.id);
  if (!goal) notFound();

  // Route guard: this screen only renders for a pending blocking task
  // that's actually due — anything else sends the user to the normal
  // task view instead of showing a stale or irrelevant alarm. Safe to
  // read current time here: getCurrentUser() already made this request
  // dynamic (reads the session cookie), so it's never statically cached.
  // eslint-disable-next-line react-hooks/purity
  const isDue = new Date(task.deadline).getTime() <= Date.now();
  if (task.notificationMode !== "blocking" || task.status !== "pending" || !isDue) {
    redirect(`/tasks/${task.id}`);
  }

  return <AlarmScreen task={task} goalTitle={goal.title} />;
}
