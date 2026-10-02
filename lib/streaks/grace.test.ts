import { describe, expect, it } from "vitest";
import {
  BADGE_THRESHOLDS,
  MAX_FREEZES_PER_MONTH,
  crossesBadgeThreshold,
  decideWeeklyOutcome,
  freezeMonthKey,
  isRepairWindowExpired,
  isSameFreezeMonth,
} from "./grace";

describe("freezeMonthKey / isSameFreezeMonth", () => {
  it("returns the first-of-month date for any day in that month", () => {
    expect(freezeMonthKey(new Date("2026-03-17T10:00:00Z"))).toBe("2026-03-01");
    expect(freezeMonthKey(new Date("2026-03-31T23:59:59Z"))).toBe("2026-03-01");
  });

  it("detects a month rollover", () => {
    expect(isSameFreezeMonth("2026-03-01", new Date("2026-03-15T00:00:00Z"))).toBe(true);
    expect(isSameFreezeMonth("2026-03-01", new Date("2026-04-01T00:00:00Z"))).toBe(false);
    expect(isSameFreezeMonth(null, new Date("2026-04-01T00:00:00Z"))).toBe(false);
  });
});

describe("isRepairWindowExpired", () => {
  it("is false when there is no window", () => {
    expect(isRepairWindowExpired(null, new Date())).toBe(false);
  });

  it("is false before expiry and true after", () => {
    const expiresAt = new Date("2026-03-15T12:00:00Z");
    expect(isRepairWindowExpired(expiresAt, new Date("2026-03-15T11:59:59Z"))).toBe(false);
    expect(isRepairWindowExpired(expiresAt, new Date("2026-03-15T12:00:01Z"))).toBe(true);
  });
});

describe("crossesBadgeThreshold", () => {
  it("matches every configured threshold", () => {
    for (const t of BADGE_THRESHOLDS) {
      expect(crossesBadgeThreshold(t)).toBe(true);
    }
  });

  it("does not match a non-threshold count", () => {
    expect(crossesBadgeThreshold(4)).toBe(false);
    expect(crossesBadgeThreshold(0)).toBe(false);
  });
});

describe("decideWeeklyOutcome", () => {
  it("increments on a met week regardless of freeze/repair state", () => {
    const decision = decideWeeklyOutcome({
      met: true,
      currentCount: 5,
      freezesUsedThisMonth: 2,
      hasOpenRepairWindow: true,
    });
    expect(decision).toEqual({ kind: "success", newCount: 6 });
  });

  it("spends a freeze on a missed week when the monthly allowance remains", () => {
    const decision = decideWeeklyOutcome({
      met: false,
      currentCount: 3,
      freezesUsedThisMonth: 0,
      hasOpenRepairWindow: false,
    });
    expect(decision).toEqual({ kind: "freeze", freezesUsedThisMonth: 1 });

    const secondFreeze = decideWeeklyOutcome({
      met: false,
      currentCount: 3,
      freezesUsedThisMonth: 1,
      hasOpenRepairWindow: false,
    });
    expect(secondFreeze).toEqual({ kind: "freeze", freezesUsedThisMonth: MAX_FREEZES_PER_MONTH });
  });

  it("opens a repair window once freezes are exhausted", () => {
    const decision = decideWeeklyOutcome({
      met: false,
      currentCount: 3,
      freezesUsedThisMonth: MAX_FREEZES_PER_MONTH,
      hasOpenRepairWindow: false,
    });
    expect(decision).toEqual({ kind: "open_repair" });
  });

  it("does nothing new while a repair window is already open", () => {
    const decision = decideWeeklyOutcome({
      met: false,
      currentCount: 3,
      freezesUsedThisMonth: MAX_FREEZES_PER_MONTH,
      hasOpenRepairWindow: true,
    });
    expect(decision).toEqual({ kind: "no_change" });
  });
});
