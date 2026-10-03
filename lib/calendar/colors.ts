// Deterministic color assignment per goal, reusing the app's existing
// --chart-1..5 tokens (grayscale value scale, no new hues) — classes are
// written out literally so Tailwind's scanner picks them up at build time.
const TONES = [
  { bg: "bg-chart-1/20", dot: "bg-chart-1", text: "text-chart-1", stroke: "stroke-chart-1" },
  { bg: "bg-chart-2/20", dot: "bg-chart-2", text: "text-chart-2", stroke: "stroke-chart-2" },
  { bg: "bg-chart-3/20", dot: "bg-chart-3", text: "text-chart-3", stroke: "stroke-chart-3" },
  { bg: "bg-chart-4/20", dot: "bg-chart-4", text: "text-chart-4", stroke: "stroke-chart-4" },
  { bg: "bg-chart-5/20", dot: "bg-chart-5", text: "text-chart-5", stroke: "stroke-chart-5" },
] as const;

export type GoalTone = (typeof TONES)[number];

export function goalToneIndex(goalId: string): number {
  let hash = 0;
  for (let i = 0; i < goalId.length; i++) hash = (hash * 31 + goalId.charCodeAt(i)) >>> 0;
  return hash % TONES.length;
}

export function goalTone(goalId: string): GoalTone {
  return TONES[goalToneIndex(goalId)];
}
