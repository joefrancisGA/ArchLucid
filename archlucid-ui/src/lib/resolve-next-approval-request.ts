import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export type ApprovalLineageNextRequestTarget = {
  readonly approvalRequestId: string;
  readonly title: string;
  readonly href: string;
};

function approvalLineageHref(approvalRequestId: string): string {
  return `/governance/approval-requests/${encodeURIComponent(approvalRequestId)}/lineage`;
}

function displayTitle(requestComment: string | null | undefined): string {
  const approvalTitle = (requestComment ?? "").trim();

  if (approvalTitle.length === 0) {
    return "Approval request";
  }

  if (approvalTitle.length > 80) {
    return `${approvalTitle.slice(0, 77)}…`;
  }

  return approvalTitle;
}

function requestedSortTime(requestedUtc: string): number {
  const parsed = parseIsoUtcMs(requestedUtc);
  return Number.isNaN(parsed) ? Number.MIN_SAFE_INTEGER : parsed;
}

/** Next approval request in queue order after the current id. */
export function resolveNextApprovalRequest(
  approvals: readonly GovernanceApprovalRequest[],
  currentApprovalRequestId: string,
): ApprovalLineageNextRequestTarget | null {
  const normalizedCurrentId = currentApprovalRequestId.trim();

  if (normalizedCurrentId.length === 0) {
    return null;
  }

  const sorted = [...approvals].sort(
    (left, right) => requestedSortTime(right.requestedUtc) - requestedSortTime(left.requestedUtc),
  );
  const currentIndex = sorted.findIndex((row) => row.approvalRequestId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  const nextRequest = sorted[currentIndex + 1];

  if (nextRequest === undefined) {
    return null;
  }

  return {
    approvalRequestId: nextRequest.approvalRequestId,
    title: displayTitle(nextRequest.requestComment),
    href: approvalLineageHref(nextRequest.approvalRequestId),
  };
}
