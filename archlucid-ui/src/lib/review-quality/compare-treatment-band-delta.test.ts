import { describe, expect, it } from "vitest";

import { buildCompareTreatmentBandDeltaView } from "@/lib/review-quality/compare-treatment-band-delta";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function sampleFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Risk",
    recommendation: "Review",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    classification: "DecisionGradeFinding",
    ...overrides,
  };
}

describe("buildCompareTreatmentBandDeltaView", () => {
  it("returns null when both sides have no stratified findings", () => {
    expect(
      buildCompareTreatmentBandDeltaView({
        baselineFindings: [],
        targetFindings: [],
      }),
    ).toBeNull();
  });

  it("summarizes decision-grade, checklist, and demoted counts per side", () => {
    const view = buildCompareTreatmentBandDeltaView({
      baselineFindings: [
        sampleFinding({ findingId: "b-1" }),
        sampleFinding({
          findingId: "b-2",
          classification: "ChecklistCoverage",
          treatment: 1,
        }),
      ],
      targetFindings: [
        sampleFinding({ findingId: "t-1" }),
        sampleFinding({ findingId: "t-2", classification: "ChecklistCoverage" }),
      ],
    });

    expect(view?.baseline.summaryLine).toContain("Decision-grade: 1");
    expect(view?.baseline.summaryLine).toContain("Demoted: 1");
    expect(view?.target.summaryLine).toContain("Checklist: 1");
  });
});
