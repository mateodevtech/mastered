import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlameIcon, TrophyIcon, SparklesIcon, type LucideIcon } from "lucide-react";

type Badge = {
  id: string;
  type: string;
  label: string;
  awardedAt: Date | string;
  goalTitle: string | null;
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  streak_milestone: FlameIcon,
  goal_completed: TrophyIcon,
  comeback: SparklesIcon,
  consistency: FlameIcon,
};

const BADGE_LABELS: Record<string, string> = {
  streak_milestone: "Série",
  goal_completed: "Objectif terminé",
  comeback: "Comeback",
  consistency: "Régularité",
};

export function BadgesCard({ badges }: { badges: Badge[] }) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Badges récents</CardTitle>
        <CardDescription>Derniers jalons franchis</CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pas encore de badge — le premier arrive avec ta première série tenue.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {badges.map((badge) => {
              const Icon = BADGE_ICONS[badge.type] ?? TrophyIcon;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {BADGE_LABELS[badge.type] ?? badge.type}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {badge.goalTitle ?? "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
