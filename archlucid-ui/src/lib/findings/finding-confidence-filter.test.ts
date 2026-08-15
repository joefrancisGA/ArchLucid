import { describe, expect, it } from "vitest";

import {
  applyFindingsConfidenceVisibility,
  isApprovalBlockingFinding,
  isLowConfidenceFinding,
  partitionQuickDecisionFindingsByConfidence,
} from "@/lib/findings/finding-confidence-filter";
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
      finding({ findingId: "low", confidenceLevel: "Low", enforcementTier: "Advisory" }),
    ]);

    expect(partition.trustedFindings.map((row) => row.findingId)).toEqual(["trusted"]);
    expect(partition.lowConfidenceFindings.map((row) => row.findingId)).toEqual(["low"]);
  });

  it("keeps approval-blocking low-confidence findings in the trusted partition", () => {
    const partition = partitionQuickDecisionFindingsByConfidence([
      finding({ findingId: "blocking-low", confidenceLevel: "Low", enforcementTier: "PolicyViolation" }),
      finding({ findingId: "noise-low", confidenceLevel: "Low", enforcementTier: "Advisory" }),
    ]);

    expect(partition.trustedFindings.map((row) => row.findingId)).toEqual(["blocking-low"]);
    expect(partition.lowConfidenceFindings.map((row) => row.findingId)).toEqual(["noise-low"]);
    expect(isApprovalBlockingFinding(finding({ confidenceLevel: "Low", enforcementTier: "PolicyViolation" }))).toBe(
      true,
    );
  });

  it("applyFindingsConfidenceVisibility retains blocking findings while hiding other low-confidence rows", () => {
    const rows = [
      finding({ findingId: "blocking-low", confidenceLevel: "Low", enforcementTier: "PolicyViolation" }),
      finding({ findingId: "noise-low", confidenceLevel: "Low", enforcementTier: "Advisory" }),
    ];
    const visibility = applyFindingsConfidenceVisibility(rows, false);

    expect(visibility.visibleFindings.map((row) => row.findingId)).toEqual(["blocking-low"]);
    expect(visibility.hiddenByConfidenceCount).toBe(1);
  });

  it("does not treat disposition-accepted policy violations as approval-blocking", () => {
    const accepted = finding({
      enforcementTier: "PolicyViolation",
      confidenceLevel: "Low",
      humanReviewStatus: 1,
      aiReasoning: {
        wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        reasoningTrace: "",
      },
    });

    expect(isApprovalBlockingFinding(accepted)).toBe(false);

    const partition = partitionQuickDecisionFindingsByConfidence([accepted]);

    expect(partition.trustedFindings).toHaveLength(0);
    expect(partition.lowConfidenceFindings.map((row) => row.findingId)).toEqual(["f-1"]);
  });
});
