import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  countUncheckedDecisionGradeSemanticSupportBands,
  formatUncheckedSemanticSupportFinalizeCopy,
  shouldShowUncheckedSemanticSupportFinalizeWarning,
} from "@/lib/findings/semantic-support-band-finalize-honesty";

function sampleFinding(
  overrides: Partial<QuickDecisionFinding> = {},
): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Sample finding",
    severity: "Warning",
    classification: "DecisionGradeFinding",
    semanticSupportBand: "Unchecked",
    ...overrides,
  };
}

describe("semantic-support-band-finalize-honesty (AS-064)", () => {
  it("counts unchecked decision-grade bands only", () => {
    const count = countUncheckedDecisionGradeSemanticSupportBands([
      sampleFinding({ findingId: "f-1", semanticSupportBand: "Unchecked" }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "Supported" }),
      sampleFinding({
        findingId: "f-3",
        semanticSupportBand: "Unchecked",
        classification: "ChecklistCoverage",
      }),
    ]);

    expect(count).toBe(1);
  });

  it("shows finalize warning in Working pre-finalize when unchecked rows exist", () => {
    expect(
      shouldShowUncheckedSemanticSupportFinalizeWarning({
        workingDesk: true,
        manifestFinalized: false,
        findings: [sampleFinding()],
      }),
    ).toBe(true);
  });

  it("hides finalize warning after seal or outside Working desk", () => {
    expect(
      shouldShowUncheckedSemanticSupportFinalizeWarning({
        workingDesk: true,
        manifestFinalized: true,
        findings: [sampleFinding()],
      }),
    ).toBe(false);

    expect(
      shouldShowUncheckedSemanticSupportFinalizeWarning({
        workingDesk: false,
        manifestFinalized: false,
        findings: [sampleFinding()],
      }),
    ).toBe(false);
  });

  it("formats warn-only copy with structural citations honesty", () => {
    expect(formatUncheckedSemanticSupportFinalizeCopy(2)).toContain("Structural citations are present");
    expect(formatUncheckedSemanticSupportFinalizeCopy(2)).toContain("Finalize stays enabled");
    expect(formatUncheckedSemanticSupportFinalizeCopy(1)).toContain("1 decision-grade finding is Unchecked");
  });
});
