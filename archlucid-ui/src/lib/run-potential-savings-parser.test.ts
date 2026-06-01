import { describe, expect, it } from "vitest";

import { heuristicAnnualUsdOpportunityFromCostArtifactJson } from "./run-potential-savings-parser";

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
