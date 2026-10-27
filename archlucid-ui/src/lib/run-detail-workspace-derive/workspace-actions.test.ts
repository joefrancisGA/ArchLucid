import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  deriveBlockingApprovalCount,
  deriveRecommendedWorkspaceActions,
  normalizeWorkspaceRecommendedActionOwnerOrRole,
} from "./workspace-actions";

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
    evidenceRefCount: partial.evidenceRefCount !== undefined ? partial.evidenceRefCount : 0,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("normalizeWorkspaceRecommendedActionOwnerOrRole (P-15)", () => {
  it("treats whitespace-only owners as omitted", () => {
    expect(normalizeWorkspaceRecommendedActionOwnerOrRole(null)).toBeNull();
    expect(normalizeWorkspaceRecommendedActionOwnerOrRole("   ")).toBeNull();
    expect(normalizeWorkspaceRecommendedActionOwnerOrRole("Remediation lead")).toBe("Remediation lead");
  });
});

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

describe("deriveRecommendedWorkspaceActions evidence ref honesty (P-05 / P-09)", () => {
  it("does not count omitted evidenceRefCount as an evidence gap", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-omitted",
          evidenceRefCount: null,
        }),
      ],
      manifestId: "manifest-1",
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
      evidenceCoverageComplete: false,
    });

    expect(actions.some((action) => action.id === "add-evidence")).toBe(false);
    expect(actions.some((action) => action.id === "evidence-ref-count-not-stored")).toBe(true);
  });
});

describe("deriveRecommendedWorkspaceActions blocking counts (P-05)", () => {
  it("does not invent a blocking count when the metric was omitted", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-medium-policy",
          severityValue: 1,
          enforcementTier: "PolicyViolation",
        }),
      ],
      manifestId: null,
      showProgressTracker: false,
      hasCommitBlockingFailures: true,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
    });

    const blocking = actions.find((action) => action.id === "review-blocking");

    expect(blocking?.reason).toContain("Blocking finding count was not stored");
    expect(blocking?.relatedFindingCount).toBeNull();
  });
});

describe("deriveRecommendedWorkspaceActions blocking counts", () => {
  it("does not promote severity to blocking when stored blocking count is zero (P-13)", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-high",
          severityValue: 3,
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

    expect(actions.find((action) => action.id === "review-blocking")).toBeUndefined();
    expect(actions.find((action) => action.id === "review-critical-high")).toBeDefined();
  });

  it("honors blockingFindingCount for medium-severity coverage failures", () => {
    const findings = [
      sampleFinding({
        findingId: "f-medium-policy",
        severityValue: 1,
        enforcementTier: "PolicyViolation",
      }),
    ];
    const blockingApprovalCount = deriveBlockingApprovalCount({
      unresolvedIssueCount: 0,
      hasCommitBlockingFailures: true,
      findings,
    });
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings,
      manifestId: null,
      showProgressTracker: false,
      hasCommitBlockingFailures: true,
      blockingFindingCount: blockingApprovalCount,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
    });

    const blocking = actions.find((action) => action.id === "review-blocking");

    expect(blockingApprovalCount).toBe(1);
    expect(blocking?.relatedFindingCount).toBe(1);
  });
});

describe("deriveRecommendedWorkspaceActions first-review-next-step copy", () => {
  it("names diagram, findings, and question before finalize (P-10)", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [],
      manifestId: null,
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: null,
      runCompleted: true,
    });

    const finalize = actions.find((action) => action.id === "finalize-review");

    expect(finalize?.reason).toMatch(/diagram and findings/i);
    expect(finalize?.reason).toMatch(/ask one question/i);
  });

  it("opens findings instead of assigning owners inline (P-17)", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [
        sampleFinding({
          findingId: "f-high",
          severityValue: 2,
          assignedToUserId: "",
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

    const assign = actions.find((action) => action.id === "assign-owners");

    expect(assign?.title).toBe("Open findings");
    expect(assign?.actionLabel).toBe("Open findings");
    expect(assign?.href).toContain("reviewTab=findings");
  });

  it("labels approval workflow as open queue (P-18)", () => {
    const actions = deriveRecommendedWorkspaceActions({
      runId: "run-1",
      findings: [],
      manifestId: "manifest-1",
      showProgressTracker: false,
      hasCommitBlockingFailures: false,
      blockingFindingCount: 0,
      buyerPolishedArtifactTable: false,
      operatorGovernanceDecision: null,
      manifestStatus: "Draft",
      runCompleted: true,
    });

    const approval = actions.find((action) => action.id === "request-approval");

    expect(approval?.actionLabel).toBe("Open approval queue");
    expect(approval?.href).toContain("approval-queue");
  });
});
