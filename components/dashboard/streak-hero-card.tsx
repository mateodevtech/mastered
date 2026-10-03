import { FlameIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StreakHeroCard({
  top,
}: {
  top: { goalTitle: string; currentCount: number; longestCount: number } | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Série actuelle</CardTitle>
        <CardDescription>{top ? top.goalTitle : "Aucun objectif récurrent"}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2 py-2 text-center">
        <FlameIcon className="size-8 text-primary" />
        <div className="text-3xl font-semibold tabular-nums">
          {top?.currentCount ?? 0}{" "}
          <span className="text-base font-normal text-muted-foreground">
            semaine{(top?.currentCount ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
        {top && top.longestCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Record personnel : <span className="font-medium text-foreground">{top.longestCount}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
