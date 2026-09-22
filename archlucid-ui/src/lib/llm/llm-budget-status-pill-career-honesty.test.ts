import { describe, expect, it } from "vitest";

import {
  buildLlmBudgetStatusPillAriaLabel,
  buildLlmBudgetStatusPillLabel,
  LLM_BUDGET_STATUS_PILL_AT_CAP_SUFFIX,
  LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY,
  resolveLlmBudgetStatusPillPresentation,
} from "@/lib/llm/llm-budget-status-pill-career-honesty";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";

function status(overrides: Partial<LlmMonthlyDollarBudgetStatus> = {}): LlmMonthlyDollarBudgetStatus {
  return {
    monthlyBudgetMonitoringActive: true,
    blocksAdditionalLlmExecution: false,
    utcMonth: "2026-05",
    hardCutoffUsdPerUtcMonth: 75,
    effectiveHardCapUsd: 75,
    purchasedCapBumpUsd: 0,
    estimatedUsdPressure: 56,
    assumedNextCallReservationUsd: 1,
    hardCapUtilizationFraction: 0.76,
    warnFraction: 0.75,
    ...overrides,
  };
}

describe("llm-budget-status-pill-career-honesty (CG-095)", () => {
  it("uses at-cap suffix instead of paused rehearsal language", () => {
    const capped = status({ blocksAdditionalLlmExecution: true, hardCapUtilizationFraction: 1 });

    expect(buildLlmBudgetStatusPillLabel(capped, 0)).toBe(`AI budget: 0% — ${LLM_BUDGET_STATUS_PILL_AT_CAP_SUFFIX}`);
    expect(buildLlmBudgetStatusPillLabel(capped, 0).toLowerCase()).not.toContain("paused");
  });

  it("aria label blocks AI calls without implying rehearsal door", () => {
    const aria = buildLlmBudgetStatusPillAriaLabel(0, true);

    expect(aria.toLowerCase()).toContain("budget cap reached");
    expect(aria.toLowerCase()).not.toContain("rehearsal");
    expect(aria.toLowerCase()).not.toContain("new reviews paused");
  });

  it("publishes career-honesty disclosure copy", () => {
    expect(LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY.toLowerCase()).toContain("not the career or rehearsal door");
  });

  it("resolves warn presentation without at-cap suffix", () => {
    const presentation = resolveLlmBudgetStatusPillPresentation(status());

    expect(presentation.atCap).toBe(false);
    expect(presentation.label).toBe("AI budget: 24%");
  });
});
