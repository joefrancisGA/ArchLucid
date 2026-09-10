import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  countUncheckedDecisionGradeSemanticSupportBands,
  countUnsupportedDecisionGradeSemanticSupportBands,
  formatUncheckedSemanticSupportFinalizeCopy,
  mergeFinalizeCommitBlockedReasons,
  resolveUnsupportedSemanticSupportFinalizeBlockedReason,
  shouldApplyUnsupportedSemanticSupportFinalizeHold,
  shouldShowUncheckedSemanticSupportFinalizeWarning,
  shouldShowUnsupportedSemanticSupportHoldOffHonesty,
} from "@/lib/findings/semantic-support-band-finalize-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

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

describe("semantic-support-band-finalize-honesty (AS-065)", () => {
  it("defaults hold off and shows honesty when unsupported rows exist", () => {
    expect(
      shouldApplyUnsupportedSemanticSupportFinalizeHold({
        workingDesk: true,
        manifestFinalized: false,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        hostQualityGateMode: "PilotStrict",
        pilotStrictHoldOnUnsupportedSemanticSupport: false,
      }),
    ).toBe(false);

    expect(
      shouldShowUnsupportedSemanticSupportHoldOffHonesty({
        workingDesk: true,
        manifestFinalized: false,
        findings: [sampleFinding({ semanticSupportBand: "Unsupported" })],
        pilotStrictHoldOnUnsupportedSemanticSupport: false,
      }),
    ).toBe(true);
  });

  it("blocks finalize only for Working Real PilotStrict when hold flag is on", () => {
    const findings = [
      sampleFinding({
        findingId: "f-unsupported",
        title: "Ingress is public",
        semanticSupportBand: "Unsupported",
      }),
    ];

    expect(
      shouldApplyUnsupportedSemanticSupportFinalizeHold({
        workingDesk: true,
        manifestFinalized: false,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        hostQualityGateMode: "PilotStrict",
        pilotStrictHoldOnUnsupportedSemanticSupport: true,
      }),
    ).toBe(true);

    expect(
      shouldApplyUnsupportedSemanticSupportFinalizeHold({
        workingDesk: true,
        manifestFinalized: false,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        hostQualityGateMode: "PilotStrict",
        pilotStrictHoldOnUnsupportedSemanticSupport: true,
      }),
    ).toBe(false);

    const blockedReason = resolveUnsupportedSemanticSupportFinalizeBlockedReason({
      workingDesk: true,
      manifestFinalized: false,
      findings,
      structuralExecutionMode: StructuralExecutionModeWire.Real,
      hostQualityGateMode: "PilotStrict",
      pilotStrictHoldOnUnsupportedSemanticSupport: true,
    });

    expect(blockedReason).toContain("Unsupported decision-grade finding");
    expect(blockedReason).toContain("f-unsupported");
    expect(countUnsupportedDecisionGradeSemanticSupportBands(findings)).toBe(1);
  });

  it("merges client finalize block reasons without dropping either lane", () => {
    expect(
      mergeFinalizeCommitBlockedReasons("Assumption gate pending.", null),
    ).toBe("Assumption gate pending.");

    expect(
      mergeFinalizeCommitBlockedReasons(
        "Assumption gate pending.",
        "1 Unsupported decision-grade finding blocks finalize under PilotStrict hold (TB-1228 opt-in).",
      ),
    ).toContain("Assumption gate pending.");
    expect(
      mergeFinalizeCommitBlockedReasons(
        "Assumption gate pending.",
        "1 Unsupported decision-grade finding blocks finalize under PilotStrict hold (TB-1228 opt-in).",
      ),
    ).toContain("Unsupported decision-grade finding");
  });
});
