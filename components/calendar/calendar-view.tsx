"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { GlassFolder } from "@/components/ui/glass-folder";
import { goalTone } from "@/lib/calendar/colors";
import type { CalendarTask } from "@/lib/db/queries/calendar";

const START_HOUR = 7;
const END_HOUR = 21;
const ROW_HEIGHT = 56;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

type GoalSummary = { id: string; title: string; type: string };

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  done: "Terminée",
  missed: "Manquée",
  snoozed: "Reportée",
};

function minutesFromStart(date: Date): number {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

export function CalendarView({
  weekStart,
  tasks,
  goals,
  miniMonth,
}: {
  weekStart: Date;
  tasks: CalendarTask[];
  goals: GoalSummary[];
  miniMonth: ReactNode;
}) {
  const [hiddenGoalIds, setHiddenGoalIds] = useState<Set<string>>(new Set());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visibleTasks = tasks.filter((t) => !hiddenGoalIds.has(t.goalId));

  function toggleGoal(goalId: string) {
    setHiddenGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  }

  return (
    <div className="flex flex-1 gap-6">
      <aside className="flex w-56 shrink-0 flex-col gap-6">
        {miniMonth}

        <div>
          <h2 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mes objectifs
          </h2>
          <ul className="flex flex-col gap-1.5">
            {goals.length === 0 && (
              <li className="text-sm text-muted-foreground">Aucun objectif actif.</li>
            )}
            {goals.map((goal) => {
              const hidden = hiddenGoalIds.has(goal.id);
              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm hover:bg-muted ${hidden ? "opacity-40" : ""}`}
                  >
                    <GlassFolder goalId={goal.id} size={22} />
                    <span className="truncate">{goal.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Catégories
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-foreground" />
              Ponctuel
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground" />
              Récurrent
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b">
            <div />
            {days.map((day) => (
              <div key={day.toISOString()} className="flex flex-col items-center gap-0.5 py-2">
                <span className="text-[11px] text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: fr })}
                </span>
                <span className="text-sm font-medium tabular-nums">{format(day, "d")}</span>
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 text-[11px] text-muted-foreground"
                  style={{ height: ROW_HEIGHT }}
                >
                  {hour}h
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div key={day.toISOString()} className="relative border-l">
                {HOURS.map((hour) => (
                  <div key={hour} className="border-b" style={{ height: ROW_HEIGHT }} />
                ))}

                {visibleTasks
                  .filter((task) => differenceInCalendarDays(task.deadline, day) === 0)
                  .map((task) => {
                    const minutes = Math.min(
                      Math.max(minutesFromStart(task.deadline), 0),
                      (END_HOUR - START_HOUR) * 60,
                    );
                    const top = (minutes / 60) * ROW_HEIGHT;
                    const tone = goalTone(task.goalId);

                    return (
                      <Popover key={task.id}>
                        <PopoverTrigger
                          className={`absolute inset-x-1 rounded-md border-l-2 px-2 py-1 text-left text-xs ${tone.bg} border-current ${tone.text} hover:brightness-95`}
                          style={{ top, height: 40 }}
                        >
                          <span className="block truncate font-medium text-foreground">
                            {task.title}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {format(task.deadline, "HH:mm")}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start">
                          <div className="flex flex-col gap-2">
                            <p className="font-medium">{task.title}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary">{task.goalTitle}</Badge>
                              <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(task.deadline, "d MMMM yyyy, HH:mm", { locale: fr })}
                            </p>
                            <Link
                              href={`/tasks/${task.id}`}
                              className="text-xs font-medium underline underline-offset-2"
                            >
                              Voir la tâche
                            </Link>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
