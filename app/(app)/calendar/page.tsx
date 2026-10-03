import Link from "next/link";
import { addDays, format, parseISO, startOfWeek, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listGoalsForUser } from "@/lib/db/queries/goals";
import { getTasksInRangeForUser } from "@/lib/db/queries/calendar";
import { Button } from "@/components/ui/button";
import { MiniMonth } from "@/components/calendar/mini-month";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { week } = await searchParams;
  const requested = week ? parseISO(week) : new Date();
  const weekStart = startOfWeek(requested, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const [tasks, goalsList] = await Promise.all([
    getTasksInRangeForUser(user.id, weekStart, weekEnd),
    listGoalsForUser(user.id),
  ]);

  const activeGoals = goalsList
    .filter((g) => g.status === "active")
    .map((g) => ({ id: g.id, title: g.title, type: g.type }));

  const prevWeekUrl = `/calendar?week=${format(subDays(weekStart, 7), "yyyy-MM-dd")}`;
  const nextWeekUrl = `/calendar?week=${format(addDays(weekStart, 7), "yyyy-MM-dd")}`;
  const todayUrl = `/calendar?week=${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")}`;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight capitalize">
            {format(weekStart, "MMMM yyyy", { locale: fr })}
          </h1>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={todayUrl} />}>
            Aujourd&apos;hui
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<Link href={prevWeekUrl} />}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<Link href={nextWeekUrl} />}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <CalendarView
        weekStart={weekStart}
        tasks={tasks}
        goals={activeGoals}
        miniMonth={<MiniMonth monthAnchor={weekStart} weekStart={weekStart} />}
      />
    </main>
  );
}
