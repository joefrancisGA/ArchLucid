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
    evidenceRefCount: partial.evidenceRefCount ?? 1,
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
      finding({ findingId: "b", title: "B", evidenceRefCount: 2 }),
    ];

    expect(countUncitedFindings(findings)).toBe(1);
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
    expect(summary?.uncitedCount).toBe(1);
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
});
