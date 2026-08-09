import { describe, expect, it } from "vitest";

import {
  countFindingsBySeverity,
  deriveBlockingApprovalCount,
  deriveExecutiveBottomLineContent,
  derivePrimaryConcernLabel,
  deriveRecommendedWorkspaceActions,
  deriveReviewStatusSummary,
  deriveRunDetailWorkspaceStatus,
  deriveSubmittedArchitectureText,
  formatDecisionSnapshotFindingsLine,
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

  it("builds narrative bottom-line copy from governance rationale and blocking findings", () => {
    const content = deriveExecutiveBottomLineContent({
      governanceDecisionLabel: "Approved with monitoring",
      governanceDecisionRationale: "Controls are acceptable for PHI handling.",
      overallPosture: "Approved with monitoring",
      blockingFindingCount: 1,
      highestSeverity: "High",
      themeSummaries: ["PHI handling"],
    });

    expect(content?.kind).toBe("narrative");
    expect(content?.kind === "narrative" ? content.text : "").toContain("Controls are acceptable");
    expect(content?.kind === "narrative" ? content.text : "").toContain("still requires an assigned owner");
    expect(content?.kind === "narrative" ? content.text : "").not.toContain("Approved with monitoring");
  });

  it("formats decision snapshot findings line with blocking and triage segments", () => {
    expect(formatDecisionSnapshotFindingsLine(3, 1, 2)).toBe("3 open · 1 blocks approval · 1 needs triage");
    expect(formatDecisionSnapshotFindingsLine(0, 0, 0)).toBe("None open");
  });

  it("maps topology extraction gaps to coverage language in primary concern", () => {
    const label = derivePrimaryConcernLabel([
      finding(1, { title: "No topology resources were found" }),
    ]);

    expect(label).toBe("Evidence did not surface topology resources");
  });

  it("omits redundant bottom-line narrative when only posture would repeat the summary strip", () => {
    const content = deriveExecutiveBottomLineContent({
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
    const content = deriveExecutiveBottomLineContent({
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
});
