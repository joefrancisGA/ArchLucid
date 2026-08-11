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
    expect(teaching.title).toBe("What will this cost?");
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
    expect(teaching.honestyNote).toMatch(/will not invent dollars/i);
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

  it("falls back to remaining allotment language without inventing package cost", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: false,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 50,
    });

    expect(teaching.kind).toBe("allotment");
    expect(teaching.message).toMatch(/AI allotment/i);
    expect(teaching.message).toMatch(/\$50\.00/);
    expect(teaching.honestyNote).toMatch(/cost preview is inactive/i);
    expect(teaching.message).not.toMatch(/typically draws about \$0\./);
  });

  it("appends remaining allotment when a range is known", () => {
    const teaching = buildPreExecuteCostEstimateTeaching({
      previewActive: true,
      estimatedCostUsdLow: 0.04,
      estimatedCostUsdHigh: 0.72,
      monthlyBudgetMonitoringActive: true,
      remainingBudgetUsd: 12.5,
    });

    expect(teaching.message).toMatch(/\$12\.50 remains in this workspace's AI allotment/i);
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
