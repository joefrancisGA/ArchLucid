import { describe, expect, it } from "vitest";

import { buildLlmBudgetCommandCenterSummary } from "@/lib/llm-cost-command-center-budget";

describe("buildLlmBudgetCommandCenterSummary", () => {
  it("returns null when budget monitoring is inactive", () => {
    expect(buildLlmBudgetCommandCenterSummary(null)).toBeNull();
    expect(
      buildLlmBudgetCommandCenterSummary({
        monthlyBudgetMonitoringActive: false,
        blocksAdditionalLlmExecution: false,
        utcMonth: "2026-05",
        hardCutoffUsdPerUtcMonth: null,
        effectiveHardCapUsd: null,
        purchasedCapBumpUsd: null,
        estimatedUsdPressure: null,
        assumedNextCallReservationUsd: null,
        hardCapUtilizationFraction: null,
        warnFraction: null,
      }),
    ).toBeNull();
  });

  it("returns HOLD when hard cap blocks execution", () => {
    const summary = buildLlmBudgetCommandCenterSummary({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: true,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 100,
      effectiveHardCapUsd: 100,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 100,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 1,
      warnFraction: 0.75,
    });

    expect(summary?.disposition).toBe("HOLD");
  });
});
