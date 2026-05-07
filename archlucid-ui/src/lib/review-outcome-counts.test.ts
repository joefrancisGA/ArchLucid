import { describe, expect, it } from "vitest";

import type { ManifestSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { resolveReviewOutcomeCounts } from "./review-outcome-counts";

function stubExplanation(overrides: Partial<RunExplanationSummary> = {}): RunExplanationSummary {
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
    riskPosture: "",
    findingCount: 0,
    decisionCount: 0,
    unresolvedIssueCount: 0,
    complianceGapCount: 0,
    ...overrides,
  };
}

describe("resolveReviewOutcomeCounts", () => {
  const baseManifest: ManifestSummary = {
    manifestId: "m1",
    runId: "claims-intake-modernization",
    createdUtc: "2026-01-01T00:00:00.000Z",
    manifestHash: "h",
    ruleSetId: "healthcare-claims-v3",
    ruleSetVersion: "3.4.1",
    decisionCount: 12,
    warningCount: 0,
    unresolvedIssueCount: 0,
    status: "Committed",
  };

  it("fills showcase findings and manifest warnings when live APIs return zeros on the spine run", () => {
    const explanation = stubExplanation({ findingCount: 0 });

    const { findingCountDisplay, warningCountDisplay } = resolveReviewOutcomeCounts({
      runId: "claims-intake-modernization",
      usedStaticDemoRun: true,
      explanationSummary: explanation,
      manifestSummary: baseManifest,
    });

    expect(findingCountDisplay).toBe(9);
    expect(warningCountDisplay).toBe(1);
  });

  it("preserves non-zero API counts when present", () => {
    const explanation = stubExplanation({ findingCount: 4 });

    const { findingCountDisplay, warningCountDisplay } = resolveReviewOutcomeCounts({
      runId: "other-run-id",
      usedStaticDemoRun: false,
      explanationSummary: explanation,
      manifestSummary: { ...baseManifest, runId: "other-run-id", warningCount: 2 },
    });

    expect(findingCountDisplay).toBe(4);
    expect(warningCountDisplay).toBe(2);
  });
});
