// Pure streak/grace rules — kept dependency-free so they're trivially
// unit-testable (see grace.test.ts) and reusable from both the nightly
// cron and the task-completion "repair" shortcut.

export const MAX_FREEZES_PER_MONTH = 2;
export const REPAIR_WINDOW_HOURS = 24;
export const BADGE_THRESHOLDS = [3, 7, 14, 30, 100] as const;

// First-of-month date string, used as the freeze-allowance rollover key.
export function freezeMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function isSameFreezeMonth(anchor: string | null, now: Date): boolean {
  return anchor === freezeMonthKey(now);
}

export function isRepairWindowExpired(
  repairWindowExpiresAt: Date | null,
  now: Date,
): boolean {
  return repairWindowExpiresAt !== null && repairWindowExpiresAt.getTime() < now.getTime();
}

export function crossesBadgeThreshold(newCount: number): boolean {
  return (BADGE_THRESHOLDS as readonly number[]).includes(newCount);
}

export type StreakDecision =
  | { kind: "success"; newCount: number }
  | { kind: "freeze"; freezesUsedThisMonth: number }
  | { kind: "open_repair" }
  | { kind: "no_change" };

// The core weekly-evaluation rule: never a hard reset on the first miss —
// prefer a freeze, then a 24h repair window, before giving up the streak.
export function decideWeeklyOutcome({
  met,
  currentCount,
  freezesUsedThisMonth,
  hasOpenRepairWindow,
}: {
  met: boolean;
  currentCount: number;
  freezesUsedThisMonth: number;
  hasOpenRepairWindow: boolean;
}): StreakDecision {
  if (met) return { kind: "success", newCount: currentCount + 1 };
  if (freezesUsedThisMonth < MAX_FREEZES_PER_MONTH) {
    return { kind: "freeze", freezesUsedThisMonth: freezesUsedThisMonth + 1 };
  }
  if (!hasOpenRepairWindow) return { kind: "open_repair" };
  return { kind: "no_change" };
}
