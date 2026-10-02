import { Badge } from "@/components/ui/badge";
import { FlameIcon, ShieldIcon, HourglassIcon } from "lucide-react";

type Streak = {
  currentCount: number;
  freezesUsedThisMonth: number;
  repairWindowExpiresAt: Date | string | null;
};

export function StreakBadge({ streak }: { streak: Streak }) {
  // Always rendered from a Server Component that already reads the
  // session cookie (getCurrentUser()), so the route is already dynamic —
  // reading current time here is safe.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const hasOpenRepair =
    streak.repairWindowExpiresAt !== null &&
    new Date(streak.repairWindowExpiresAt).getTime() > now;

  if (hasOpenRepair) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
        <HourglassIcon className="size-3" />
        Streak en réparation — complète une tâche bientôt
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <FlameIcon className="size-3" />
      {streak.currentCount} semaine{streak.currentCount === 1 ? "" : "s"}
      {streak.freezesUsedThisMonth > 0 && (
        <span className="inline-flex items-center gap-0.5 text-muted-foreground">
          <ShieldIcon className="size-3" />
          {streak.freezesUsedThisMonth}
        </span>
      )}
    </Badge>
  );
}
