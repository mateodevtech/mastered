import { Badge } from "@/components/ui/badge";
import { AwardIcon } from "lucide-react";

const LABELS: Record<string, string> = {
  "streak-3": "3 semaines d'affilée",
  "streak-7": "7 semaines d'affilée",
  "streak-14": "14 semaines d'affilée",
  "streak-30": "30 semaines d'affilée",
  "streak-100": "100 semaines d'affilée",
};

export function BadgeList({ badges }: { badges: { id: string; label: string }[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge.id} variant="outline" className="gap-1">
          <AwardIcon className="size-3" />
          {LABELS[badge.label] ?? badge.label}
        </Badge>
      ))}
    </div>
  );
}
