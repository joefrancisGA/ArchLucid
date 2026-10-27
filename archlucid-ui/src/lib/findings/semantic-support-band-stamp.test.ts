import { describe, expect, it } from "vitest";

import {
  countDecisionGradeSemanticSupportBands,
  formatStampSemanticSupportBandLine,
  formatStampUnsupportedSemanticSupportLabels,
  listUnsupportedDecisionGradeSemanticSupportFindings,
  stampSemanticSupportShowsAllClear,
} from "@/lib/findings/semantic-support-band-stamp";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function sampleFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Risk 1",
    recommendation: "Review",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    ...overrides,
  };
}

describe("semantic support band stamp (AS-062)", () => {
  it("counts decision-grade bands only", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ findingId: "f-1", semanticSupportBand: "Supported" }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "Unchecked" }),
      sampleFinding({
        findingId: "f-3",
        semanticSupportBand: "Unsupported",
        classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
      }),
      sampleFinding({ findingId: "f-4", semanticSupportBand: "Unsupported" }),
    ]);

    expect(counts).toEqual({
      supported: 1,
      unchecked: 1,
      unsupported: 1,
      notScored: 0,
      missingStoredBand: 0,
      decisionGradeTotal: 3,
    });
  });

  it("treats a missing wire band as not stored instead of Not scored", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: null }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "NotScored" }),
    ]);

    expect(counts.notScored).toBe(1);
    expect(counts.missingStoredBand).toBe(1);
    expect(formatStampSemanticSupportBandLine(counts)).toContain("Semantic support band was not stored.");
    expect(formatStampSemanticSupportBandLine(counts)).not.toContain("2 Not scored");
  });

  it("formats Working stamp line with decision-grade prefix", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: "Supported" }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "Unchecked" }),
      sampleFinding({ findingId: "f-3", semanticSupportBand: "Unsupported" }),
    ]);

    expect(formatStampSemanticSupportBandLine(counts)).toBe(
      "Semantic support (decision-grade): 1 Supported · 1 Unchecked · 1 Unsupported",
    );
  });

  it("uses compact Guided eval prefix", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: "Supported" }),
    ]);

    expect(formatStampSemanticSupportBandLine(counts, { compact: true })).toBe(
      "Semantic support: 1 Supported · 0 Unchecked · 0 Unsupported",
    );
  });

  it("lists unsupported decision-grade findings for stamp honesty", () => {
    const entries = listUnsupportedDecisionGradeSemanticSupportFindings([
      sampleFinding({ findingId: "bad-1", title: "Public database ingress", semanticSupportBand: "Unsupported" }),
      sampleFinding({
        findingId: "check-1",
        semanticSupportBand: "Unsupported",
        classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
      }),
    ]);

    expect(formatStampUnsupportedSemanticSupportLabels(entries)).toEqual([
      "Finding id: bad-1 — Public database ingress",
    ]);
  });

  it("does not show all-clear when unsupported findings exist", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: "Unsupported" }),
    ]);

    expect(stampSemanticSupportShowsAllClear(counts)).toBe(false);
  });

  it("shows all-clear only when decision-grade has zero unsupported", () => {
    const counts = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: "Supported" }),
    ]);

    expect(stampSemanticSupportShowsAllClear(counts)).toBe(true);
  });

  it("does not show all-clear when unchecked or missing-band findings remain", () => {
    const unchecked = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: "Unchecked" }),
    ]);
    const missingBand = countDecisionGradeSemanticSupportBands([
      sampleFinding({ semanticSupportBand: null }),
    ]);

    expect(stampSemanticSupportShowsAllClear(unchecked)).toBe(false);
    expect(stampSemanticSupportShowsAllClear(missingBand)).toBe(false);
  });
});
