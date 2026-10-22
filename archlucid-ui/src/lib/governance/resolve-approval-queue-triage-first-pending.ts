import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export type ApprovalQueueTriageFirstPendingTarget = {
  readonly approvalRequestId: string;
  readonly runId: string;
  readonly manifestVersion: string;
  readonly requestedUtc: string;
  readonly sourceEnvironment: string;
  readonly targetEnvironment: string;
};

function isPendingApprovalStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return normalized === "submitted" || normalized === "pending" || normalized === "inreview";
}

/** Oldest pending approval request for triage-first guidance on the approval queue. */
export function resolveApprovalQueueTriageFirstPending(
  approvals: readonly GovernanceApprovalRequest[],
): ApprovalQueueTriageFirstPendingTarget | null {
  const pendingApprovals = approvals.filter((row) => isPendingApprovalStatus(row.status));

  if (pendingApprovals.length === 0) {
    return null;
  }

  const sorted = [...pendingApprovals].sort((left, right) => {
    const leftRequested = Date.parse(left.requestedUtc);
    const rightRequested = Date.parse(right.requestedUtc);

    if (Number.isNaN(leftRequested) && Number.isNaN(rightRequested)) {
      return left.approvalRequestId.localeCompare(right.approvalRequestId);
    }

    if (Number.isNaN(leftRequested)) {
      return 1;
    }

    if (Number.isNaN(rightRequested)) {
      return -1;
    }

    return leftRequested - rightRequested;
  });

  const first = sorted[0];

  if (first === undefined) {
    return null;
  }

  return {
    approvalRequestId: first.approvalRequestId,
    runId: first.runId,
    manifestVersion: first.manifestVersion,
    requestedUtc: first.requestedUtc,
    sourceEnvironment: first.sourceEnvironment,
    targetEnvironment: first.targetEnvironment,
  };
}
