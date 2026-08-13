import { describe, expect, it } from "vitest";

import {
  countFindingsBySeverity,
  deriveArchitectureSystemName,
  deriveBlockingApprovalCount,
  deriveEvidenceCoverageSummary,
  deriveSponsorBottomLineContent,
  deriveFinalizedAtUtc,
  derivePrimaryConcernLabel,
  deriveRecommendedWorkspaceActions,
  deriveReviewHeaderPresentation,
  deriveReviewStatusSummary,
  deriveRunDetailWorkspaceStatus,
  derivePackageVersionLabel,
  deriveSignedReviewRecordIdLabel,
  deriveSubmittedArchitectureText,
  formatDecisionSnapshotFindingsLine,
  formatDecisionSnapshotGovernanceOutcome,
  shortenNextActionForPrimaryCta,
} from "@/lib/run-detail-workspace-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunSummary } from "@/types/authority";

function finding(severityValue: number, overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: `f-${severityValue}`,
    title: "Test finding",
    recommendation: "Do something",
    severityValue,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "Blocking",
    ...overrides,
  };
}

describe("run-detail-workspace-derive", () => {
  it("counts severities from findings", () => {
    const counts = countFindingsBySeverity([
      finding(3),
      finding(2),
      finding(1),
      finding(0),
      finding(3, { isMuted: true }),
    ]);

    expect(counts).toEqual({ critical: 1, high: 1, medium: 1, low: 1 });
  });

  it("maps draft vs analysis-in-progress status", () => {
    const draft = deriveRunDetailWorkspaceStatus({
      run: { runId: "r1", projectId: "p1", createdUtc: "2026-01-01T00:00:00Z" } as RunSummary,
      manifestId: null,
      manifestStatus: null,
      showProgressTracker: false,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: false,
    });

    expect(draft.label).toBe("Draft");

    const inProgress = deriveRunDetailWorkspaceStatus({
      run: { runId: "r1", projectId: "p1", createdUtc: "2026-01-01T00:00:00Z" } as RunSummary,
      manifestId: null,
      manifestStatus: null,
      showProgressTracker: true,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: false,
    });

    expect(inProgress.label).toBe("Analysis in progress");
  });

  it("distinguishes quality-gate reject from execution failed (TB-965)", () => {
    const quality = deriveRunDetailWorkspaceStatus({
      run: {
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00Z",
        legacyRunStatus: "ExecutionCompletedQualityRejected",
      } as RunSummary,
      manifestId: null,
      manifestStatus: null,
      showProgressTracker: false,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: false,
    });

    expect(quality).toMatchObject({
      label: "Quality gate rejected",
      kind: "quality-gate-rejected",
      statusTagKind: "needs-attention",
    });

    const failed = deriveRunDetailWorkspaceStatus({
      run: {
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00Z",
        legacyRunStatus: "Failed",
      } as RunSummary,
      manifestId: null,
      manifestStatus: null,
      showProgressTracker: false,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: false,
    });

    expect(failed).toMatchObject({
      label: "Execution failed",
      kind: "execution-failed",
      statusTagKind: "needs-attention",
    });
  });

  it("prefers unresolved issue count for blocking approval count", () => {
    const count = deriveBlockingApprovalCount({
      unresolvedIssueCount: 2,
      hasCommitBlockingFailures: false,
      findings: [],
    });

    expect(count).toBe(2);
  });

  it("hides run-id echo from submitted architecture text", () => {
    const run = {
      runId: "abc-123",
      projectId: "p1",
      createdUtc: "2026-01-01T00:00:00Z",
      description: "abc-123",
    } as RunSummary;

    expect(deriveSubmittedArchitectureText(run, "My review")).toBeNull();
  });

  it("builds narrative bottom-line copy from governance rationale only (blocking counts stay in Decision snapshot)", () => {
    const content = deriveSponsorBottomLineContent({
      governanceDecisionLabel: "Approved with monitoring",
      governanceDecisionRationale: "Controls are acceptable for PHI handling.",
      overallPosture: "Approved with monitoring",
      blockingFindingCount: 1,
      highestSeverity: "High",
      themeSummaries: ["PHI handling"],
    });

    expect(content?.kind).toBe("narrative");
    expect(content?.kind === "narrative" ? content.text : "").toContain("Controls are acceptable");
    expect(content?.kind === "narrative" ? content.text : "").not.toContain("still requires an assigned owner");
    expect(content?.kind === "narrative" ? content.text : "").not.toContain("Approved with monitoring");
  });

  it("maps finalized manifest with blocking findings to composite workspace status", () => {
    const status = deriveRunDetailWorkspaceStatus({
      run: { runId: "r1", projectId: "p1", createdUtc: "2026-01-01T00:00:00Z" } as RunSummary,
      manifestId: "manifest-1",
      manifestStatus: "Finalized",
      showProgressTracker: false,
      operatorGovernanceDecision: null,
      buyerPolishedArtifactTable: true,
      blockingFindingCount: 1,
    });

    expect(status.label).toBe("Finalized · approval blocked");
    expect(status.statusTagKind).toBe("needs-attention");
  });

  it("uses plural verb in blocking findings recommended action reason", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-abc",
      findings: [finding(2)],
      manifestId: "manifest-1",
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 1,
      buyerPolishedArtifactTable: true,
      operatorGovernanceDecision: "Approved",
      manifestStatus: "Finalized",
      runCompleted: true,
    });

    const blocking = actions.find((action) => action.id === "review-blocking");

    expect(blocking?.reason).toContain("currently blocks approval");
  });

  it("formats decision snapshot findings line with blocking and triage segments", () => {
    expect(formatDecisionSnapshotFindingsLine(3, 1, 2)).toBe("3 open · 1 blocks approval · 1 needs triage");
    expect(formatDecisionSnapshotFindingsLine(0, 0, 0)).toBe("None open");
  });

  it("maps topology extraction gaps to coverage language in primary concern", () => {
    const label = derivePrimaryConcernLabel([
      finding(1, { title: "No topology resources were found" }),
    ]);

    expect(label).toBe("Evidence did not surface architecture components");
  });

  it("qualifies the governance snapshot line when findings block approval", () => {
    expect(
      formatDecisionSnapshotGovernanceOutcome({ governanceDecisionLabel: "Pending", blockingFindingCount: 1 }),
    ).toBe("Pending · blocked by 1 unresolved finding");

    expect(
      formatDecisionSnapshotGovernanceOutcome({ governanceDecisionLabel: "Pending", blockingFindingCount: 3 }),
    ).toBe("Pending · blocked by 3 unresolved findings");
  });

  it("leaves the governance snapshot line alone when nothing blocks approval", () => {
    expect(
      formatDecisionSnapshotGovernanceOutcome({ governanceDecisionLabel: "Approved", blockingFindingCount: 0 }),
    ).toBe("Approved");
  });

  it("does not append a second blocking qualifier", () => {
    expect(
      formatDecisionSnapshotGovernanceOutcome({
        governanceDecisionLabel: "Finalized · approval blocked",
        blockingFindingCount: 2,
      }),
    ).toBe("Finalized · approval blocked");
  });

  it("omits redundant bottom-line narrative when only posture would repeat the summary strip", () => {
    const content = deriveSponsorBottomLineContent({
      governanceDecisionLabel: "Approved with monitoring",
      governanceDecisionRationale: null,
      overallPosture: "Approved with monitoring",
      blockingFindingCount: 0,
      highestSeverity: "High",
      themeSummaries: null,
    });

    expect(content).toBeNull();
  });

  it("derives review status summary from findings and recommended actions", () => {
    const summary = deriveReviewStatusSummary({
      reviewOutcome: "Approved with monitoring",
      findings: [
        finding(2, { findingId: "phi-minimization-risk", title: "PHI Minimization Risk" }),
        finding(0, { findingId: "f-low", title: "Low item" }),
      ],
      recommendedActions: [],
      blockingFindingCount: 0,
    });

    expect(summary.reviewOutcome).toBe("Approved with monitoring");
    expect(summary.highestUnresolvedSeverity).toBe("High");
    expect(summary.openFindingsCount).toBe(2);
    expect(summary.primaryConcern).toBe("PHI Minimization Risk");
    expect(summary.nextAction).toContain("Confirm evidence and remediation ownership");
  });

  it("falls back to key decision considerations when only theme labels exist", () => {
    const content = deriveSponsorBottomLineContent({
      governanceDecisionLabel: "No governance decision recorded",
      governanceDecisionRationale: null,
      overallPosture: "Needs review",
      blockingFindingCount: 0,
      highestSeverity: null,
      themeSummaries: ["PHI handling", "Auditability"],
    });

    expect(content).toEqual({
      kind: "considerations",
      themes: ["PHI handling", "Auditability"],
    });
  });

  it("omits add-evidence action when evidence coverage is complete", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-abc",
      findings: [
        finding(2, { evidenceRefCount: 0 }),
      ],
      manifestId: "manifest-1",
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: true,
      operatorGovernanceDecision: "Approved",
      manifestStatus: "Finalized",
      runCompleted: true,
      evidenceCoverageComplete: true,
    });

    expect(actions.some((action) => action.id === "add-evidence")).toBe(false);
    expect(actions.every((action) => action.actionLabel.length > 0)).toBe(true);
  });

  it("uses template label for H1 when manifest exists without a system name", () => {
    const presentation = deriveReviewHeaderPresentation({
      reviewTitle: "ArchLucid",
      systemName: null,
      runId: "run-abc-123",
      templateLabel: "Healthcare baseline pack",
      manifestId: "manifest-1",
    });

    expect(presentation.h1Title).toBe("Healthcare baseline pack");
    expect(presentation.h1Title).not.toBe("Architecture under review");
  });

  it("disambiguates product-brand titles in the review header", () => {
    const presentation = deriveReviewHeaderPresentation({
      reviewTitle: "ArchLucid",
      systemName: "Payments platform",
      runId: "run-abc-123",
    });

    expect(presentation.h1Title).toBe("Payments platform");
    expect(presentation.eyebrowLabel).toBe("Architecture review");
  });

  it("suppresses duplicate eyebrow text and rejects document metadata titles", () => {
    const presentation = deriveReviewHeaderPresentation({
      reviewTitle: "> Reviewed: 2026-07-26",
      systemName: "> Reviewed: 2026-07-26",
      runId: "run-abc-123",
    });

    expect(presentation.h1Title).toBe("Architecture under review");
    expect(presentation.eyebrowLabel).toBe("Architecture review");
  });

  it("falls back to Architecture under review when only document metadata exists", () => {
    const presentation = deriveReviewHeaderPresentation({
      reviewTitle: "> Reviewed: 2026-07-26",
      systemName: null,
      runId: "run-abc-123",
      templateLabel: null,
      manifestId: null,
    });

    expect(presentation.h1Title).toBe("Architecture under review");
    expect(presentation.eyebrowLabel).toBe("Architecture review");
  });

  it("does not invent package version from manifest id", () => {
    expect(derivePackageVersionLabel(null, "9026d565-0000-0000-0000-0000000099e8")).toBeNull();
    expect(derivePackageVersionLabel({ ruleSetVersion: "2.1.0" } as never, "manifest-1")).toBe("2.1.0");
  });

  it("formats signed review record id labels without treating them as versions", () => {
    expect(deriveSignedReviewRecordIdLabel("9026d565-0000-0000-0000-0000000099e8")).toBe("9026d565…99e8");
  });

  it("uses ArchLucid as H1 when it is the system name and no other label exists", () => {
    const presentation = deriveReviewHeaderPresentation({
      reviewTitle: "ArchLucid",
      systemName: null,
      runId: "run-abc-123",
    });

    expect(presentation.h1Title).toBe("ArchLucid");
    expect(presentation.h1Title).not.toBe("Architecture under review");
    expect(presentation.eyebrowLabel).toBe("Architecture review");
  });

  it("derives ArchLucid as system name when displayName matches the review headline", () => {
    const systemName = deriveArchitectureSystemName(
      {
        runId: "run-1",
        projectId: "p1",
        displayName: "ArchLucid",
        description: "Architecture review intake for \"ArchLucid\".",
      } as RunSummary,
      "ArchLucid",
    );

    expect(systemName).toBe("ArchLucid");
  });

  it("clamps and strips markdown from a long displayName architecture package blob", () => {
    const blob = `**Reviewed** ${"classification detail ".repeat(200)}`;
    const systemName = deriveArchitectureSystemName(
      {
        runId: "run-1",
        projectId: "p1",
        displayName: blob,
        description: "",
      } as RunSummary,
      "Architecture review",
    );

    expect(systemName).not.toBeNull();
    expect(systemName!.length).toBeLessThanOrEqual(80);
    expect(systemName).not.toContain("**");
  });

  it("summarizes evidence coverage for open findings", () => {
    const summary = deriveEvidenceCoverageSummary([
      finding(2, { evidenceRefCount: 1 }),
      finding(1, { evidenceRefCount: 0 }),
    ]);

    expect(summary.summaryLine).toBe("1 of 2 open findings have linked evidence");
  });

  it("shortens next-action copy for primary CTA labels", () => {
    expect(
      shortenNextActionForPrimaryCta(
        "Review findings — 1 unresolved finding currently blocks approval or finalization.",
      ),
    ).toBe("Review findings");
  });

  it("does not ellipsis-truncate long next-action prose for primary CTAs", () => {
    expect(
      shortenNextActionForPrimaryCta(
        "Confirm evidence and remediation ownership for the open medium-severity finding",
      ),
    ).toBeNull();
  });

  it("omits Finalized at when the package is not finalized", () => {
    const utc = deriveFinalizedAtUtc(
      {
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00Z",
      } as RunSummary,
      null,
      null,
    );

    expect(utc).toBeNull();
  });

  it("uses completedUtc for Finalized at when a manifest exists", () => {
    const utc = deriveFinalizedAtUtc(
      {
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00Z",
        completedUtc: "2026-01-02T12:00:00Z",
      } as RunSummary,
      { createdUtc: "2026-01-02T11:00:00Z" } as never,
      "manifest-1",
    );

    expect(utc).toBe("2026-01-02T12:00:00Z");
  });
});
