import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export type GovernanceApprovalWorkflowPhase =
  | "no_review"
  | "loading"
  | "no_requests"
  | "pending"
  | "approved"
  | "rejected"
  | "mixed";

export type GovernanceApprovalWorkflowState = {
  readonly phase: GovernanceApprovalWorkflowPhase;
  readonly requestCount: number;
  readonly approvedCount: number;
  readonly pendingCount: number;
  readonly rejectedCount: number;
  readonly primaryApprovedRequest: GovernanceApprovalRequest | null;
  /** True when at least one approval request row has status Approved. */
  readonly hasApprovedRequest: boolean;
  /** Completion messaging is allowed only when an approved request exists. */
  readonly canShowCompletionMessaging: boolean;
};

export type DeriveGovernanceApprovalWorkflowStateInput = {
  readonly activeRunId: string | null;
  readonly approvals: readonly GovernanceApprovalRequest[];
  readonly listsLoading: boolean;
};

function normalizedStatus(status: string): string {
  return status.trim().toLowerCase();
}

function isPendingStatus(status: string): boolean {
  const normalized = normalizedStatus(status);

  return normalized === "submitted" || normalized === "pending" || normalized === "inreview";
}

function isApprovedStatus(status: string): boolean {
  return normalizedStatus(status) === "approved";
}

function isRejectedStatus(status: string): boolean {
  const normalized = normalizedStatus(status);

  return normalized === "rejected" || normalized === "denied";
}

function emptyWorkflowState(phase: "no_review" | "loading"): GovernanceApprovalWorkflowState {
  return {
    phase,
    requestCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    primaryApprovedRequest: null,
    hasApprovedRequest: false,
    canShowCompletionMessaging: false,
  };
}

/** Single derivation for governance approval banners, story cards, and request history. */
export function deriveGovernanceApprovalWorkflowState(
  input: DeriveGovernanceApprovalWorkflowStateInput,
): GovernanceApprovalWorkflowState {
  const { activeRunId, approvals, listsLoading } = input;

  if (activeRunId === null) {
    return emptyWorkflowState("no_review");
  }

  if (listsLoading && approvals.length === 0) {
    return emptyWorkflowState("loading");
  }

  const approvedRows = approvals.filter((row) => isApprovedStatus(row.status));
  const pendingRows = approvals.filter((row) => isPendingStatus(row.status));
  const rejectedRows = approvals.filter((row) => isRejectedStatus(row.status));
  const approvedCount = approvedRows.length;
  const pendingCount = pendingRows.length;
  const rejectedCount = rejectedRows.length;
  const requestCount = approvals.length;

  if (requestCount === 0) {
    return {
      phase: "no_requests",
      requestCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      primaryApprovedRequest: null,
      hasApprovedRequest: false,
      canShowCompletionMessaging: false,
    };
  }

  const hasApprovedRequest = approvedCount > 0;
  let phase: GovernanceApprovalWorkflowPhase;

  if (hasApprovedRequest && pendingCount === 0 && rejectedCount === 0 && approvedCount === requestCount) {
    phase = "approved";
  } else if (!hasApprovedRequest && pendingCount > 0 && rejectedCount === 0) {
    phase = "pending";
  } else if (!hasApprovedRequest && rejectedCount > 0 && pendingCount === 0) {
    phase = "rejected";
  } else {
    phase = "mixed";
  }

  return {
    phase,
    requestCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    primaryApprovedRequest: approvedRows[0] ?? null,
    hasApprovedRequest,
    canShowCompletionMessaging: hasApprovedRequest,
  };
}
