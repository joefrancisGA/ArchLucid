import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { deriveRecommendedWorkspaceActions } from "./workspace-actions";

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
});
