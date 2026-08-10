import { describe, expect, it } from "vitest";

import { resolveExecutiveTrendSavingsUsd } from "@/lib/execution-mode-honesty";

describe("resolveExecutiveTrendSavingsUsd (TB-984)", () => {
  const mixedPoint = {
    totalEstimatedUsdSavings: 500,
    realModeSavingsUsd: 300,
    realRunCount: 3,
    simulatorRunCount: 2,
  };

  const simulatorOnlyPoint = {
    totalEstimatedUsdSavings: 100,
    realModeSavingsUsd: 0,
    realRunCount: 0,
    simulatorRunCount: 4,
  };

  it("keeps aggregate totals on operator-density shells", () => {
    expect(resolveExecutiveTrendSavingsUsd(mixedPoint, false)).toBe(500);
    expect(resolveExecutiveTrendSavingsUsd(simulatorOnlyPoint, false)).toBe(100);
  });

  it("uses Real-mode savings on buyer-polished shells", () => {
    expect(resolveExecutiveTrendSavingsUsd(mixedPoint, true)).toBe(300);
    expect(resolveExecutiveTrendSavingsUsd(simulatorOnlyPoint, true)).toBe(0);
  });
});
