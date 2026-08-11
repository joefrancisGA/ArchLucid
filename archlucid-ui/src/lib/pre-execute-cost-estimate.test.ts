import { describe, expect, it } from "vitest";

import {
  buildPreExecuteCostEstimateTeaching,
  PRE_EXECUTE_COST_ESTIMATE_TITLE,
  preExecuteCostEstimateInputFromPreviewPayload,
} from "@/lib/pre-execute-cost-estimate";

describe("buildPreExecuteCostEstimateTeaching (TB-2233)", () => {
  it("uses the canonical title", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({});

    expect(teaching.title).toBe(PRE_EXECUTE_COST_ESTIMATE_TITLE);
    expect(teaching.title).toBe("Included AI usage");
  });

  it("never invents USD when preview is inactive even if estimate fields are set", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: false,
      estimatedCostUsdLow: 0.04,
      estimatedCostUsdHigh: 0.72,
      pricingUsesIllustrativeUsdRates: true,
    });

    expect(teaching.kind).toBe("unknown");
    expect(teaching.message).not.toMatch(/\$/);
  });

  it("keeps pre-run states allowance-first without estimate disclaimers", () => {
    const unknown = buildPreExecuteCostEstimateTeaching({ previewActive: false });
    const allotment = buildPreExecuteCostEstimateTeaching({
      previewActive: false,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 75,
    });

    expect(unknown.message).toMatch(/already includes/i);
    expect(unknown.honestyNote).toBeNull();
    expect(allotment.message).toMatch(/already includes/i);
    expect(allotment.honestyNote).toBeNull();
  });

  it("speaks a low–high range for Real-mode preview bands", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      estimatedCostUsdLow: 0.04,
      estimatedCostUsdHigh: 0.72,
      pricingUsesIllustrativeUsdRates: false,
    });

    expect(teaching.kind).toBe("range");
    expect(teaching.message).toMatch(/architecture package/i);
    expect(teaching.message).toMatch(/\$0\.04/);
    expect(teaching.message).toMatch(/\$0\.72/);
    expect(teaching.honestyNote).toMatch(/planning estimate/i);
  });

  it("flags illustrative rates honestly", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      estimatedCostUsdLow: 0.1,
      estimatedCostUsdHigh: 0.5,
      pricingUsesIllustrativeUsdRates: true,
    });

    expect(teaching.honestyNote).toMatch(/illustrative list rates/i);
  });

  it("uses a point estimate when only high/single amount is present", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      estimatedCostUsd: 0.42,
      pricingUsesIllustrativeUsdRates: false,
    });

    expect(teaching.kind).toBe("point");
    expect(teaching.message).toMatch(/\$0\.42/);
  });

  it("falls back to remaining allowance language without inventing package cost", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: false,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 50,
    });

    expect(teaching.kind).toBe("allotment");
    expect(teaching.message).toMatch(/AI usage your plan already includes/i);
    expect(teaching.message).toMatch(/\$50\.00/);
    expect(teaching.message).not.toMatch(/typically draws about \$0\./);
  });

  it("still flags a missing range when the cost preview is active", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 50,
    });

    expect(teaching.kind).toBe("allotment");
    expect(teaching.honestyNote).toMatch(/will not invent one/i);
  });

  it("appends remaining allowance when a range is known", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      estimatedCostUsdLow: 0.04,
      estimatedCostUsdHigh: 0.72,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 12.5,
    });

    expect(teaching.message).toMatch(/\$12\.50 of this month's AI budget allowance is left/i);
  });

  it("ignores remaining budget when monthly monitoring is inactive", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      monthlyBudgetMonitoringActive: false,
      remainingBudgetUsd: 99,
    });

    expect(teaching.kind).toBe("unknown");
    expect(teaching.message).not.toMatch(/\$99/);
  });
});

describe("preExecuteCostEstimateInputFromPreviewPayload", () => {
  it("marks Simulator payloads as preview-inactive", () => {
    const input = preExecuteCostEstimateInputFromPreviewPayload({
      mode: "Simulator",
      estimatedCostUsd: 0.5,
      estimatedCostUsdLow: 0.1,
      estimatedCostUsdHigh: 0.5,
      pricingUsesIllustrativeUsdRates: true,
    });

    expect(input.previewActive).toBe(false);
    expect(input.estimatedCostUsd).toBeNull();
  });

  it("passes Real-mode fields through with budget allotment", () => {
    const input = preExecuteCostEstimateInputFromPreviewPayload(
      {
        mode: "Real",
        estimatedCostUsd: 0.72,
        estimatedCostUsdLow: 0.04,
        estimatedCostUsdHigh: 0.72,
        pricingUsesIllustrativeUsdRates: true,
      },
      { monthlyBudgetMonitoringActive: true, remainingBudgetUsd: 40 },
    );

    expect(input.previewActive).toBe(true);
    expect(input.estimatedCostUsdLow).toBe(0.04);
    expect(input.remainingBudgetUsd).toBe(40);
  });

  it("treats a missing payload as inactive preview", () => {
    const input = preExecuteCostEstimateInputFromPreviewPayload(null, {
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 10,
    });

    expect(input.previewActive).toBe(false);
    expect(input.remainingBudgetUsd).toBe(10);
  });
});
