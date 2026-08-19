import { describe, expect, it } from "vitest";

import { resolveSponsorTrendSavingsUsd } from "@/lib/execution-mode-honesty";

describe("resolveSponsorTrendSavingsUsd (TB-984)", () => {
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
    expect(resolveSponsorTrendSavingsUsd(mixedPoint, false)).toBe(500);
    expect(resolveSponsorTrendSavingsUsd(simulatorOnlyPoint, false)).toBe(100);
  });

  it("uses Real-mode savings on buyer-polished shells", () => {
    expect(resolveSponsorTrendSavingsUsd(mixedPoint, true)).toBe(300);
    expect(resolveSponsorTrendSavingsUsd(simulatorOnlyPoint, true)).toBe(0);
  });
});
