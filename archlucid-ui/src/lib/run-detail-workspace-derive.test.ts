import { describe, expect, it } from "vitest";

import {
  countFindingsBySeverity,
  deriveBlockingApprovalCount,
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
});
