import { describe, expect, it } from "vitest";

import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

import {
  decisionNeedsReview,
  deriveDecisionRegisterSummary,
  isHighConfidenceDecision,
} from "./decision-register-summary";

describe("deriveDecisionRegisterSummary", () => {
  it("summarizes recorded, recent, and confidence posture", () => {
    const decisions: ArchitectureDecisionRegisterEntry[] = [
      {
        decisionId: "d-1",
        manifestId: "m-1",
        runId: "r-1",
        category: "Security",
        title: "Approved monitoring",
        selectedOption: "A",
        rationale: "Evidence-backed",
        confidence: 0.9,
        buyerConfidenceSource: "Evidence-backed",
        recordedAtUtc: "2026-07-01T12:00:00.000Z",
        supportingFindingIds: ["f-1"],
      },
      {
        decisionId: "d-2",
        manifestId: "m-2",
        runId: "r-2",
        category: "Cost",
        title: "Needs review",
        selectedOption: "B",
        rationale: "Low confidence",
        confidence: 0.2,
        buyerConfidenceSource: "Unknown",
        recordedAtUtc: "2026-01-01T12:00:00.000Z",
        supportingFindingIds: [],
      },
    ];

    const summary = deriveDecisionRegisterSummary(decisions);

    expect(summary.recordedDecisions).toBe(2);
    expect(summary.highConfidenceDecisions).toBe(1);
    expect(summary.decisionsNeedingReview).toBe(1);
    expect(summary.lastRecordedDecisionLabel).not.toBe("—");
  });

  it("does not count a decision as high confidence when it also needs review", () => {
    const evidenceBackedLowConfidence: ArchitectureDecisionRegisterEntry = {
      decisionId: "d-3",
      manifestId: "m-3",
      runId: "r-3",
      category: "Security",
      title: "Weak numeric confidence",
      selectedOption: "A",
      rationale: "Evidence trail incomplete",
      confidence: 0.2,
      buyerConfidenceSource: "Evidence-backed",
      recordedAtUtc: "2026-07-02T12:00:00.000Z",
      supportingFindingIds: [],
    };

    expect(decisionNeedsReview(evidenceBackedLowConfidence)).toBe(true);
    expect(isHighConfidenceDecision(evidenceBackedLowConfidence)).toBe(false);

    const summary = deriveDecisionRegisterSummary([evidenceBackedLowConfidence]);

    expect(summary.highConfidenceDecisions).toBe(0);
    expect(summary.decisionsNeedingReview).toBe(1);
  });
});
