import { describe, expect, it } from "vitest";

import { resolvePreCommitGatePreviewView } from "@/lib/governance/pre-commit-gate-preview";
import { deriveFirstReviewSpineBandSummary, countUncitedFindings } from "@/lib/reviews/first-review-spine-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId" | "title">): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title,
    severityValue: partial.severityValue ?? 2,
    classification: partial.classification ?? "DecisionGradeFinding",
    evidenceRefCount: partial.evidenceRefCount === undefined ? 1 : partial.evidenceRefCount,
    humanReviewStatus: partial.humanReviewStatus ?? null,
    recommendation: partial.recommendation ?? "Fix it",
    insightDensityScore: partial.insightDensityScore ?? 90,
    isMuted: partial.isMuted ?? false,
    policyRuleId: partial.policyRuleId ?? null,
    engineKey: partial.engineKey ?? null,
  } as QuickDecisionFinding;
}

describe("first-review-spine-band", () => {
  it("counts uncited findings from evidenceRefCount", () => {
    const findings = [
      finding({ findingId: "a", title: "A", evidenceRefCount: 0 }),
      finding({ findingId: "b", title: "B", evidenceRefCount: null }),
    ];

    expect(countUncitedFindings(findings)).toBe(1);
  });

  it("withholds classification counts when findings snapshot was not stored", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: null,
      structuralExecutionMode: "Simulator",
      findings: [finding({ findingId: "high", title: "Issue", severityValue: 3 })],
      hasFindingsSnapshot: false,
    });

    expect(summary?.gateOutcomeDetail).toContain("Findings snapshot was not stored");
    expect(summary?.classificationCountsStored).toBe(false);
    expect(summary?.dispositionCountsStored).toBe(false);
    expect(summary?.showTopFindingRow).toBe(false);
  });

  it("derives gate, execution mode, and top finding for the stamp spine", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: {
        kind: "SoftInfeasible",
        summary: "Must questions skipped.",
        transparencyTrail: null,
      },
      structuralExecutionMode: "Simulator",
      findings: [
        finding({ findingId: "low", title: "Low issue", severityValue: 1 }),
        finding({ findingId: "high", title: "Public endpoint exposed", severityValue: 3, evidenceRefCount: 0 }),
      ],
    });

    expect(summary?.gateOutcomeLabel).toBeTruthy();
    expect(summary?.executionModeLabel).toBe("Simulator");
    expect(summary?.topFindingTitle).toBe("Public endpoint exposed");
    expect(summary?.topFindingId).toBe("high");
    expect(summary?.uncitedCount).toBe(1);
    expect(summary?.semanticSupportLine).toMatch(/Semantic support/i);
    expect(summary?.treatmentSummaryLine).toMatch(/Decision-grade:/i);
    expect(summary?.showDispositionNextAction).toBe(true);
  });
});

describe("pre-commit-gate-preview", () => {
  it("maps blocked simulate results to block disposition with pack threshold", () => {
    const preview = resolvePreCommitGatePreviewView({
      blocked: true,
      policyPackId: "enterprise-baseline",
      minimumBlockingSeverity: 3,
      reason: "Critical findings remain open.",
      blockingFindingIds: ["f-1", "f-2"],
    });

    expect(preview?.disposition).toBe("block");
    expect(preview?.minimumBlockingSeverityLabel).toBe("Critical");
    expect(preview?.blockingFindingCount).toBe(2);
  });

  it("does not treat an omitted gate payload as clear", () => {
    const preview = resolvePreCommitGatePreviewView({});

    expect(preview?.disposition).toBe("not-stored");
    expect(preview?.title).toBe("Pre-commit gate result was not stored.");
    expect(preview?.detail).not.toContain("Pre-commit gate clear");
  });

  it("uses not-stored copy for blocked results missing pack and severity", () => {
    const preview = resolvePreCommitGatePreviewView({
      blocked: true,
      policyPackId: null,
      minimumBlockingSeverity: null,
    });

    expect(preview?.detail).toContain("Policy pack id was not stored.");
    expect(preview?.detail).toContain("Blocking severity was not stored.");
    expect(preview?.detail).not.toContain("Pack unknown");
  });
});
