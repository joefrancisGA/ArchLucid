import { describe, expect, it } from "vitest";

import {
  llmBudgetRemainingPercent,
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
  shouldShowShellLlmBudgetStatusPill,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";

function status(partial: Partial<LlmMonthlyDollarBudgetStatus>): LlmMonthlyDollarBudgetStatus {
  return {
    monthlyBudgetMonitoringActive: true,
    blocksAdditionalLlmExecution: false,
    utcMonth: "2026-05",
    hardCutoffUsdPerUtcMonth: 100,
    effectiveHardCapUsd: 100,
    purchasedCapBumpUsd: 0,
    estimatedUsdPressure: 50,
    assumedNextCallReservationUsd: 1,
    hardCapUtilizationFraction: 0.5,
    warnFraction: 0.75,
    ...partial,
  };
}

describe("resolveLlmBudgetUtilizationTone", () => {
  it("returns warn when utilization meets warn fraction", () => {
    expect(resolveLlmBudgetUtilizationTone(status({ hardCapUtilizationFraction: 0.8, warnFraction: 0.75 }))).toBe(
      "warn",
    );
  });

  it("returns critical when execution is blocked", () => {
    expect(
      resolveLlmBudgetUtilizationTone(
        status({ hardCapUtilizationFraction: 0.5, blocksAdditionalLlmExecution: true }),
      ),
    ).toBe("critical");
  });

  it("returns ok below warn fraction", () => {
    expect(resolveLlmBudgetUtilizationTone(status({ hardCapUtilizationFraction: 0.2, warnFraction: 0.75 }))).toBe("ok");
  });
});

describe("shouldShowShellLlmBudgetStatusPill", () => {
  it("hides when monitoring is inactive", () => {
    expect(shouldShowShellLlmBudgetStatusPill(status({ monthlyBudgetMonitoringActive: false }))).toBe(false);
  });

  it("hides when utilization tone is ok", () => {
    expect(shouldShowShellLlmBudgetStatusPill(status({ hardCapUtilizationFraction: 0.1, warnFraction: 0.75 }))).toBe(
      false,
    );
  });

  it("shows when utilization meets warn fraction", () => {
    expect(shouldShowShellLlmBudgetStatusPill(status({ hardCapUtilizationFraction: 0.8, warnFraction: 0.75 }))).toBe(
      true,
    );
  });

  it("shows when execution is blocked", () => {
    expect(
      shouldShowShellLlmBudgetStatusPill(status({ blocksAdditionalLlmExecution: true, hardCapUtilizationFraction: 0.2 })),
    ).toBe(true);
  });
});

describe("llmBudgetUtilizationPercent", () => {
  it("returns null when monitoring inactive", () => {
    expect(llmBudgetUtilizationPercent(status({ monthlyBudgetMonitoringActive: false }))).toBeNull();
  });

  it("caps display at 100 percent", () => {
    expect(llmBudgetUtilizationPercent(status({ hardCapUtilizationFraction: 1.4 }))).toBe(100);
  });
});

describe("llmBudgetRemainingPercent", () => {
  it("derives headroom from utilization", () => {
    expect(llmBudgetRemainingPercent(status({ hardCapUtilizationFraction: 0.8 }))).toBe(20);
  });

  it("floors at zero when utilization exceeds the cap", () => {
    expect(llmBudgetRemainingPercent(status({ hardCapUtilizationFraction: 1.2 }))).toBe(0);
  });
});
