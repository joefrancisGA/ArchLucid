import { describe, expect, it } from "vitest";

import { buildExplanationConfidenceSummary } from "@/lib/run-explanation-confidence-disposition";
import type { RunExplanationSummary } from "@/types/explanation";

function minimalSummary(overrides: Partial<RunExplanationSummary> = {}): RunExplanationSummary {
  return {
    explanation: {
      rawText: "",
      structured: null,
      confidence: null,
      provenance: null,
      summary: "",
      keyDrivers: [],
      riskImplications: [],
      costImplications: [],
      complianceImplications: [],
      detailedNarrative: "",
    },
    themeSummaries: [],
    overallAssessment: "",
    riskPosture: "Moderate",
    findingCount: 1,
    decisionCount: 0,
    unresolvedIssueCount: 0,
    complianceGapCount: 0,
    ...overrides,
  };
}

describe("buildExplanationConfidenceSummary", () => {
  it("returns HOLD when deterministic fallback was used", () => {
    const summary = buildExplanationConfidenceSummary(
      minimalSummary({ deterministicFallbackUsed: true }),
    );

    expect(summary?.disposition).toBe("HOLD");
  });

  it("returns WARN when faithfulness ratio is partial", () => {
    const summary = buildExplanationConfidenceSummary(
      minimalSummary({ faithfulnessSupportRatio: 0.65 }),
    );

    expect(summary?.disposition).toBe("WARN");
  });
});
