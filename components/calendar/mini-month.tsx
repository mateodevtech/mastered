import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function MiniMonth({ monthAnchor, weekStart }: { monthAnchor: Date; weekStart: Date }) {
  const gridStart = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function weekUrl(day: Date) {
    const start = startOfWeek(day, { weekStartsOn: 1 });
    return `/calendar?week=${format(start, "yyyy-MM-dd")}`;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">
          {format(monthAnchor, "MMMM yyyy", { locale: fr })}
        </span>
        <div className="flex gap-1">
          <Link
            href={weekUrl(subMonths(monthAnchor, 1))}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Link>
          <Link
            href={weekUrl(addMonths(monthAnchor, 1))}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="text-muted-foreground">
            {label}
          </span>
        ))}
        {days.map((day) => {
          const inWeek = day >= weekStart && day <= weekEnd;
          return (
            <Link
              key={day.toISOString()}
              href={weekUrl(day)}
              className={[
                "flex size-6 items-center justify-center justify-self-center rounded-full",
                !isSameMonth(day, monthAnchor) ? "text-muted-foreground/40" : "text-foreground",
                inWeek ? "bg-muted" : "",
                isToday(day) ? "font-semibold ring-1 ring-foreground/30" : "",
                isSameDay(day, weekStart) ? "bg-primary text-primary-foreground" : "",
              ].join(" ")}
            >
              {format(day, "d")}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
