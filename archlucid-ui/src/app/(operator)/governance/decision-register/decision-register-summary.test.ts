import { describe, expect, it } from "vitest";

import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

import { deriveDecisionRegisterSummary } from "./decision-register-summary";

describe("deriveDecisionRegisterSummary", () => {
  it("summarizes signed, recent, and confidence posture", () => {
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

    expect(summary.signedDecisions).toBe(2);
    expect(summary.highConfidenceDecisions).toBe(1);
    expect(summary.decisionsNeedingReview).toBe(1);
    expect(summary.lastRecordedDecisionLabel).not.toBe("—");
  });
});
