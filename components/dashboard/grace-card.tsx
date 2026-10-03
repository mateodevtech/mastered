import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_FREEZES_PER_MONTH } from "@/lib/streaks/grace";

type Streak = {
  freezesUsedThisMonth: number;
  repairWindowExpiresAt: Date | string | null;
};

function DotBar({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-3.5 w-1.5 rounded-sm ${i < filled ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

export function GraceCard({ streak }: { streak: Streak | null }) {
  // Server Component on an already-dynamic route (session cookie read
  // upstream) — current time here is safe, same as the rest of /dashboard.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const repairMs = streak?.repairWindowExpiresAt
    ? new Date(streak.repairWindowExpiresAt).getTime() - now
    : null;
  const repairOpen = repairMs !== null && repairMs > 0;
  const repairHours = repairOpen ? Math.ceil(repairMs! / 3_600_000) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grâce &amp; réparation</CardTitle>
        <CardDescription>Ce mois-ci</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium tabular-nums">
              {streak?.freezesUsedThisMonth ?? 0} / {MAX_FREEZES_PER_MONTH}
            </span>
            <span className="text-xs text-muted-foreground">freezes utilisés</span>
          </div>
          <DotBar filled={streak?.freezesUsedThisMonth ?? 0} total={MAX_FREEZES_PER_MONTH} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium tabular-nums">
              {repairOpen ? `${repairHours}h` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">fenêtre de réparation</span>
          </div>
          {repairOpen ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Complète une tâche avant l&apos;échéance pour la refermer.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Aucune réparation en cours.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
