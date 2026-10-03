import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyCompletion } from "@/lib/db/queries/dashboard";

export function ProgressionCard({ days }: { days: DailyCompletion[] }) {
  const scheduled = days.filter((d) => d.total > 0);
  const doneCount = scheduled.reduce((sum, d) => sum + d.done, 0);
  const totalCount = scheduled.reduce((sum, d) => sum + d.total, 0);
  const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Progression</CardTitle>
        <CardDescription>{days.length} derniers jours, toutes tâches</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{rate}%</div>
            <div className="text-xs text-muted-foreground">taux de complétion</div>
          </div>
        </div>
        <div className="flex h-24 items-end gap-[3px]">
          {days.map((day) => {
            const ratio = day.total > 0 ? day.done / day.total : 0;
            const height = day.total === 0 ? 4 : Math.max(8, Math.round(ratio * 96));
            const color =
              day.total === 0
                ? "bg-muted"
                : ratio === 1
                  ? "bg-primary"
                  : ratio > 0
                    ? "bg-primary/40"
                    : "bg-destructive/50";
            return (
              <div
                key={day.date}
                className={`flex-1 rounded-t-sm ${color}`}
                style={{ height: `${height}px` }}
                title={`${day.date} — ${day.done}/${day.total}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Il y a {days.length} j</span>
          <span>Aujourd&apos;hui</span>
        </div>
      </CardContent>
    </Card>
  );
}
