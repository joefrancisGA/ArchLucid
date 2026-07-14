import { describe, expect, it } from "vitest";

import {
  countFindingsBySeverity,
  deriveBlockingApprovalCount,
  deriveExecutiveBottomLineContent,
  deriveRecommendedWorkspaceActions,
  deriveRunDetailWorkspaceStatus,
  deriveSubmittedArchitectureText,
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

  it("builds narrative bottom-line copy from governance data", () => {
    const content = deriveExecutiveBottomLineContent({
      governanceDecisionLabel: "Approved with monitoring",
      governanceDecisionRationale: "Controls are acceptable for PHI handling.",
      overallPosture: "Approved with monitoring",
      blockingFindingCount: 1,
      highestSeverity: "High",
      themeSummaries: ["PHI handling"],
    });

    expect(content?.kind).toBe("narrative");
    expect(content?.kind === "narrative" ? content.text : "").toContain("Approved with monitoring");
    expect(content?.kind === "narrative" ? content.text : "").toContain("PHI handling");
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
