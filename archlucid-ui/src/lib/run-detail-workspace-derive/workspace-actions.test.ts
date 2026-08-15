import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { deriveBlockingApprovalCount, deriveRecommendedWorkspaceActions } from "./workspace-actions";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Sample finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    evidenceRefCount: partial.evidenceRefCount ?? 0,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("deriveRecommendedWorkspaceActions", () => {
  it("does not recommend owner assignment for disposition-closed high findings", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-accepted-high",
          severityValue: 2,
          humanReviewStatus: null,
          aiReasoning: {
            reasoningTrace: "",
            wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
          },
        }),
      ],
      manifestId: null,
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
    });

    expect(actions.some((action) => action.id === "assign-owners")).toBe(false);
  });

  it("does not recommend reviewing critical/high findings when disposition already closed them", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-accepted-high",
          severityValue: 2,
          humanReviewStatus: null,
          aiReasoning: {
            reasoningTrace: "",
            wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
          },
        }),
      ],
      manifestId: null,
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
    });

    expect(actions.some((action) => action.id === "review-critical-high")).toBe(false);
  });
});

describe("deriveBlockingApprovalCount", () => {
  it("ignores disposition-closed findings when coverage failures force a client-side count", () => {
    const count = deriveBlockingApprovalCount({
      unresolvedIssueCount: 0,
      hasCommitBlockingFailures: true,
      findings: [
        sampleFinding({
          findingId: "f-accepted-blocking",
          severityValue: 2,
          enforcementTier: "PolicyViolation",
          humanReviewStatus: null,
          aiReasoning: {
            reasoningTrace: "",
            wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
          },
        }),
      ],
    });

    expect(count).toBe(0);
  });
});
