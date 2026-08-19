import { describe, expect, it } from "vitest";

import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

import { deriveGovernanceApprovalWorkflowState } from "./governance-approval-workflow-state";

function request(overrides: Partial<GovernanceApprovalRequest> & Pick<GovernanceApprovalRequest, "status">): GovernanceApprovalRequest {
  return {
    approvalRequestId: overrides.approvalRequestId ?? "approval-001",
    runId: overrides.runId ?? "run-001",
    manifestVersion: overrides.manifestVersion ?? "1.0.0",
    sourceEnvironment: overrides.sourceEnvironment ?? "dev",
    targetEnvironment: overrides.targetEnvironment ?? "test",
    status: overrides.status,
    requestedBy: overrides.requestedBy ?? "Taylor Morgan",
    reviewedBy: overrides.reviewedBy ?? null,
    requestComment: overrides.requestComment ?? null,
    reviewComment: overrides.reviewComment ?? null,
    requestedUtc: overrides.requestedUtc ?? "2026-01-14T21:00:00.000Z",
    reviewedUtc: overrides.reviewedUtc ?? null,
  };
}

describe("deriveGovernanceApprovalWorkflowState", () => {
  it("returns no_review when no run is selected", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: null,
      approvals: [],
      listsLoading: false,
    });

    expect(state.phase).toBe("no_review");
    expect(state.canShowCompletionMessaging).toBe(false);
  });

  it("returns loading while requests are still fetching", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [],
      listsLoading: true,
    });

    expect(state.phase).toBe("loading");
    expect(state.canShowCompletionMessaging).toBe(false);
  });

  it("returns no_requests when a review is loaded without approval history", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [],
      listsLoading: false,
    });

    expect(state.phase).toBe("no_requests");
    expect(state.canShowCompletionMessaging).toBe(false);
  });

  it("returns pending when only submitted requests exist", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [request({ status: "Submitted" })],
      listsLoading: false,
    });

    expect(state.phase).toBe("pending");
    expect(state.canShowCompletionMessaging).toBe(false);
  });

  it("returns approved when an approved request exists", () => {
    const approved = request({
      status: "Approved",
      reviewedBy: "Jordan Lee",
      reviewedUtc: "2026-01-14T22:05:00.000Z",
    });
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [approved],
      listsLoading: false,
    });

    expect(state.phase).toBe("approved");
    expect(state.canShowCompletionMessaging).toBe(true);
    expect(state.primaryApprovedRequest).toEqual(approved);
  });

  it("returns rejected when only rejected requests exist", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [request({ status: "Rejected", reviewedBy: "Jordan Lee" })],
      listsLoading: false,
    });

    expect(state.phase).toBe("rejected");
    expect(state.canShowCompletionMessaging).toBe(false);
  });

  it("returns mixed when approved and pending requests coexist", () => {
    const state = deriveGovernanceApprovalWorkflowState({
      activeRunId: "run-001",
      approvals: [
        request({ approvalRequestId: "a-approved", status: "Approved", reviewedBy: "Jordan Lee" }),
        request({ approvalRequestId: "a-pending", status: "Submitted" }),
      ],
      listsLoading: false,
    });

    expect(state.phase).toBe("mixed");
    expect(state.hasApprovedRequest).toBe(true);
    expect(state.canShowCompletionMessaging).toBe(true);
  });
});
