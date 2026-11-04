import { describe, expect, it } from "vitest";

import { resolvePreCommitGatePreviewView } from "@/lib/governance/pre-commit-gate-preview";
import { deriveFirstReviewSpineBandSummary, countUncitedFindings, resolveFirstReviewOpenGate, resolveRunDetailVisitDefaultReviewTab, resolveRunDetailVisitDefaultFindingIdWhenUrlSilent, resolveRunDetailVisitDefaultReviewHashWhenUrlSilent, resolveFirstReviewOpenGateReviewHref, resolveFirstUncitedFindingId, resolveFirstOpenDispositionFindingId, FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED } from "@/lib/reviews/first-review-spine-band";
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
    expect(summary?.openGateLabel).toBe(FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED);
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

  it("resolveFirstReviewOpenGate prefers uncited findings over open dispositions", () => {
    expect(
      resolveFirstReviewOpenGate({
        uncitedCount: 1,
        openDecisionGradeDispositionCount: 2,
        reviewHasGoldenManifest: false,
      }),
    ).toEqual({ label: "Uncited finding", reviewTab: "findings" });
  });

  it("resolveFirstReviewOpenGate names uncommitted review when manifest is absent", () => {
    expect(
      resolveFirstReviewOpenGate({
        uncitedCount: 0,
        openDecisionGradeDispositionCount: 0,
        reviewHasGoldenManifest: false,
      }),
    ).toEqual({ label: "Uncommitted review", reviewTab: "review-package" });
  });

  it("resolveRunDetailVisitDefaultReviewTab returns findings when uncited findings remain", () => {
    const findings = [finding({ findingId: "f-1", title: "Uncited", evidenceRefCount: 0 })];
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: null,
      structuralExecutionMode: "Simulator",
      findings,
      reviewHasGoldenManifest: true,
    });

    expect(
      resolveRunDetailVisitDefaultReviewTab({
        findings,
        hasFindingsSnapshot: true,
        reviewHasGoldenManifest: true,
      }),
    ).toBe("findings");
    expect(summary?.openGateReviewTab).toBe("findings");
  });

  it("resolveRunDetailVisitDefaultFindingIdWhenUrlSilent returns the highest-severity uncited finding", () => {
    const findings = [
      finding({ findingId: "low", title: "Low", severityValue: 1, evidenceRefCount: 0 }),
      finding({ findingId: "high", title: "High", severityValue: 3, evidenceRefCount: 0 }),
    ];

    expect(resolveFirstUncitedFindingId(findings)).toBe("high");
    expect(
      resolveRunDetailVisitDefaultFindingIdWhenUrlSilent({
        findings,
        hasFindingsSnapshot: true,
      }),
    ).toBe("high");
  });

  it("resolveRunDetailVisitDefaultReviewHashWhenUrlSilent targets review-package spine for uncommitted reviews", () => {
    const findings = [
      finding({
        findingId: "checklist",
        title: "Checklist",
        classification: "ChecklistFinding",
        severityValue: 1,
        evidenceRefCount: 2,
      }),
    ];

    expect(
      resolveRunDetailVisitDefaultReviewHashWhenUrlSilent({
        findings,
        hasFindingsSnapshot: true,
        reviewHasGoldenManifest: false,
      }),
    ).toBe("run-detail-first-review-spine-review-package");
  });

  it("resolveRunDetailVisitDefaultReviewHashWhenUrlSilent targets findings spine for uncited open gate", () => {
    const findings = [finding({ findingId: "u", title: "Uncited", evidenceRefCount: 0 })];

    expect(
      resolveRunDetailVisitDefaultReviewHashWhenUrlSilent({
        findings,
        hasFindingsSnapshot: true,
        reviewHasGoldenManifest: true,
      }),
    ).toBe("run-detail-first-review-spine-findings");
  });

  it("resolveFirstReviewOpenGateReviewHref includes findingId and spine hash for uncited gate", () => {
    const findings = [finding({ findingId: "finding-1", title: "Uncited", evidenceRefCount: 0, severityValue: 3 })];

    expect(
      resolveFirstReviewOpenGateReviewHref({
        runId: "run-abc",
        findings,
        hasFindingsSnapshot: true,
        reviewHasGoldenManifest: false,
      }),
    ).toBe(
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
    );
  });

  it("resolveFirstReviewOpenGateReviewHref includes review-package spine hash for uncommitted reviews", () => {
    const findings = [
      finding({
        findingId: "checklist",
        title: "Checklist",
        classification: "ChecklistFinding",
        evidenceRefCount: 2,
      }),
    ];

    expect(
      resolveFirstReviewOpenGateReviewHref({
        runId: "run-abc",
        findings,
        hasFindingsSnapshot: true,
        reviewHasGoldenManifest: false,
      }),
    ).toBe("/architecture/reviews/run-abc?reviewTab=review-package#run-detail-first-review-spine-review-package");
  });

  it("resolveRunDetailVisitDefaultFindingIdWhenUrlSilent returns open disposition when findings are cited", () => {
    const findings = [
      finding({ findingId: "cited-open", title: "Open DG", severityValue: 3, evidenceRefCount: 2 }),
      finding({ findingId: "cited-closed", title: "Closed", severityValue: 2, evidenceRefCount: 1, humanReviewStatus: "Approved" }),
    ];

    expect(resolveFirstOpenDispositionFindingId(findings)).toBe("cited-open");
    expect(
      resolveRunDetailVisitDefaultFindingIdWhenUrlSilent({
        findings,
        hasFindingsSnapshot: true,
      }),
    ).toBe("cited-open");
  });

  it("deriveFirstReviewSpineBandSummary surfaces the first open gate on the stamp spine", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: { kind: "SoftInfeasible", summary: "Gate summary.", transparencyTrail: null },
      structuralExecutionMode: "Simulator",
      findings: [finding({ findingId: "dg", title: "Decision grade", severityValue: 2 })],
      reviewHasGoldenManifest: false,
    });

    expect(summary?.openGateLabel).toBe("Open disposition");
    expect(summary?.openGateReviewTab).toBe("findings");
  });

  it("deriveFirstReviewSpineBandSummary reports no open gate when review is sealed and findings are cited", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: { kind: "Feasible", summary: "Clear.", transparencyTrail: null },
      structuralExecutionMode: "Simulator",
      findings: [
        finding({
          findingId: "cl",
          title: "Checklist item",
          classification: "ChecklistFinding",
          evidenceRefCount: 2,
        }),
      ],
      reviewHasGoldenManifest: true,
    });

    expect(summary?.openGateLabel).toBeNull();
    expect(summary?.openGateReviewTab).toBeNull();
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
