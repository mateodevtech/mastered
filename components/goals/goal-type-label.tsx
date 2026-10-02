import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  one_off: "Ponctuel",
  recurring: "Récurrent",
  long_term: "Long terme",
};

export function GoalTypeBadge({ type }: { type: string }) {
  return <Badge variant="secondary">{LABELS[type] ?? type}</Badge>;
}
