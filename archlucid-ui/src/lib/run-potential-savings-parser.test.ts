import { describe, expect, it } from "vitest";

import {
  heuristicAnnualUsdOpportunityFromCostArtifactJson,
  heuristicAnnualUsdOpportunityFromOrphanCandidatesJson,
} from "./run-potential-savings-parser";

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

  it("sums orphan candidate monthly savings envelopes", () => {
    const amount = heuristicAnnualUsdOpportunityFromOrphanCandidatesJson({
      candidates: [{ estimatedMonthlySavings: 220 }, { estimatedMonthlySavings: 180 }],
    });

    expect(amount).toBeCloseTo((220 + 180) * 12);
  });

  it("coerces raw orphan arrays", () => {
    const amount = heuristicAnnualUsdOpportunityFromOrphanCandidatesJson([{ annualSavingsAmount: 7200 }]);

    expect(amount).toBeCloseTo(7200);
  });
});
