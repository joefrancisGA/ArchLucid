import { describe, expect, it } from "vitest";

import {
  isLowConfidenceFinding,
  partitionQuickDecisionFindingsByConfidence,
} from "@/lib/finding-confidence-filter";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Sample",
    recommendation: "Fix it.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...overrides,
  };
}

describe("finding-confidence-filter", () => {
  it("isLowConfidenceFinding returns true for Low confidence level", () => {
    expect(isLowConfidenceFinding(finding({ confidenceLevel: "Low" }))).toBe(true);
  });

  it("isLowConfidenceFinding returns true for evaluation score below threshold", () => {
    expect(isLowConfidenceFinding(finding({ evaluationConfidenceScore: 33 }))).toBe(true);
    expect(isLowConfidenceFinding(finding({ evaluationConfidenceScore: 0.25 }))).toBe(true);
  });

  it("isLowConfidenceFinding returns false for medium/high confidence", () => {
    expect(isLowConfidenceFinding(finding({ confidenceLevel: "High" }))).toBe(false);
    expect(isLowConfidenceFinding(finding({ evaluationConfidenceScore: 72 }))).toBe(false);
  });

  it("partitionQuickDecisionFindingsByConfidence splits trusted and low-confidence rows", () => {
    const partition = partitionQuickDecisionFindingsByConfidence([
      finding({ findingId: "trusted", confidenceLevel: "High" }),
      finding({ findingId: "low", confidenceLevel: "Low" }),
    ]);

    expect(partition.trustedFindings.map((row) => row.findingId)).toEqual(["trusted"]);
    expect(partition.lowConfidenceFindings.map((row) => row.findingId)).toEqual(["low"]);
  });
});
