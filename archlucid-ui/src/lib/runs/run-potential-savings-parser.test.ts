import { describe, expect, it } from "vitest";

import { heuristicAnnualUsdOpportunityFromCostArtifactJson } from "@/lib/runs/run-potential-savings-parser";

describe("run-potential-savings-parser", () => {
  it("sums Advisor-style annual blocks", () => {
    const amount = heuristicAnnualUsdOpportunityFromCostArtifactJson({
      recommendationId: "reco-1",
      potentialSavings: { annualSavingsAmount: 9600 },
    });

    expect(amount).toBeCloseTo(9600);
  });

  it("annualizes Advisor monthly hints", () => {
    const amount = heuristicAnnualUsdOpportunityFromCostArtifactJson({
      potentialSavings: { estimatedMonthlySavings: 410 },
    });

    expect(amount).toBeCloseTo(410 * 12);
  });

  it.each([
    ["Estimated Monthly Savings", 1800],
    ["Estimated Annual Savings", 150],
    ["PotentialMonthlySavings", 1800],
  ])("reads cost-management opportunity from %s", (heading, expected) => {
    const amount = heuristicAnnualUsdOpportunityFromCostArtifactJson({
      properties: { columns: [{ name: "PreTaxCost" }, { name: heading }], rows: [[900, 150]] },
    });

    expect(amount).toBe(expected);
  });

  it("ignores billed cost without a savings column", () => {
    const amount = heuristicAnnualUsdOpportunityFromCostArtifactJson({
      properties: { columns: [{ name: "PreTaxCost" }], rows: [[900]] },
    });

    expect(amount).toBe(0);
  });

  it("parses CM-style column matrices when headings imply opportunity", () => {
    const amount = heuristicAnnualUsdOpportunityFromCostArtifactJson({
      properties: {
        columns: [{ name: "PotentialMonthlySavings" }],
        rows: [[150]],
      },
    });

    expect(amount).toBeCloseTo(150 * 12);
  });

});
