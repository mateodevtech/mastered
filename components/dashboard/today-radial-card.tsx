import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodayCompletion } from "@/lib/db/queries/dashboard";

const RADIUS = 75;
const CIRCUMFERENCE = Math.PI * RADIUS; // semicircle

export function TodayRadialCard({ today }: { today: TodayCompletion }) {
  const ratio = today.total > 0 ? today.done / today.total : 0;
  const dash = ratio * CIRCUMFERENCE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aujourd&apos;hui</CardTitle>
        <CardDescription>Tâches, toutes échéances</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative h-[98px] w-[170px]">
          <svg viewBox="0 0 170 98" width="170" height="98">
            <path
              d="M 10 92 A 75 75 0 0 1 160 92"
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 10 92 A 75 75 0 0 1 160 92"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <div className="text-xl font-semibold tabular-nums">
              {today.done}/{today.total}
            </div>
            <div className="text-xs text-muted-foreground">complétées</div>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-sm font-medium tabular-nums text-destructive">
              {today.overdue}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              En retard
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium tabular-nums">{today.blocking}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Bloquante
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
