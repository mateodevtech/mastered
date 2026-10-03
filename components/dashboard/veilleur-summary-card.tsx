import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VeilleurSummary } from "@/lib/db/queries/veilleur";

function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

export function VeilleurSummaryCard({ summary }: { summary: VeilleurSummary | null }) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Veilleur</CardTitle>
          <CardDescription>Personne ne t&apos;accompagne pour l&apos;instant</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Invite un Veilleur depuis la page d&apos;un objectif pour qu&apos;il suive ta
          progression.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Veilleur</CardTitle>
        <CardDescription>
          <Link href={`/goals/${summary.goalId}`} className="hover:text-foreground">
            {summary.goalTitle}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {summary.veilleurName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{summary.veilleurName}</p>
            {summary.acceptedAt && (
              <p className="text-xs text-muted-foreground">
                Actif depuis {daysSince(summary.acceptedAt)} j
              </p>
            )}
          </div>
        </div>
        {summary.latestNote && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            « {summary.latestNote} »
          </p>
        )}
      </CardContent>
    </Card>
  );
}
