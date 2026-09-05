import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";

import { deriveFindingsHiddenFilterHonesty } from "@/lib/findings/findings-hidden-filter-honesty";

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("findings-hidden-filter-honesty (DA-08)", () => {
  it("returns no line when all toolbar-filtered rows are visible", () => {
    const result = deriveFindingsHiddenFilterHonesty({
      toolbarFilteredCount: 10,
      visibleCount: 10,
      hiddenFindings: [],
    });

    expect(result.hasHidden).toBe(false);
    expect(result.line).toBeNull();
  });

  it("counts hidden rows for the honesty band", () => {
    const result = deriveFindingsHiddenFilterHonesty({
      toolbarFilteredCount: 13,
      visibleCount: 10,
      hiddenFindings: [
        finding({ findingId: "h-1", classification: "ChecklistCoverage" }),
        finding({ findingId: "h-2", classification: "ChecklistCoverage" }),
        finding({ findingId: "h-3", classification: "ChecklistCoverage" }),
      ],
    });

    expect(result.hiddenCount).toBe(3);
    expect(result.line).toBe("3 findings hidden by filters");
  });

  it("uses stronger copy when decision-grade rows are hidden", () => {
    const result = deriveFindingsHiddenFilterHonesty({
      toolbarFilteredCount: 11,
      visibleCount: 10,
      hiddenFindings: [
        finding({
          findingId: "dg-1",
          classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        }),
      ],
    });

    expect(result.line).toContain("decision-grade row is hidden");
  });
});
