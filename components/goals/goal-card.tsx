import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalTypeBadge } from "@/components/goals/goal-type-label";
import { GoalProgress } from "@/components/goals/goal-progress";
import { StreakBadge } from "@/components/goals/streak-badge";
import { GlassFolder } from "@/components/ui/glass-folder";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  type: string;
};

type Streak = {
  currentCount: number;
  freezesUsedThisMonth: number;
  repairWindowExpiresAt: Date | string | null;
};

export function GoalCard({
  goal,
  progress,
  streak,
}: {
  goal: Goal;
  progress?: { done: number; total: number };
  streak?: Streak | null;
}) {
  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <GlassFolder goalId={goal.id} size={28} className="shrink-0" />
              <CardTitle className="line-clamp-1">{goal.title}</CardTitle>
            </div>
            <GoalTypeBadge type={goal.type} />
          </div>
          {goal.description && (
            <CardDescription className="line-clamp-2">{goal.description}</CardDescription>
          )}
          {streak && <StreakBadge streak={streak} />}
        </CardHeader>
        {progress && (
          <CardContent>
            <GoalProgress done={progress.done} total={progress.total} />
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
