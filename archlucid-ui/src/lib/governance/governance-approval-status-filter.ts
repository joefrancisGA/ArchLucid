import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export const GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM = "approvalStatus" as const;

export type GovernanceApprovalStatusFilter = "pending" | "approved" | "rejected";

const GOVERNANCE_APPROVAL_STATUS_FILTER_VALUES: ReadonlySet<GovernanceApprovalStatusFilter> = new Set([
  "pending",
  "approved",
  "rejected",
]);

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

export function parseGovernanceApprovalStatusFilter(raw: string | null | undefined): GovernanceApprovalStatusFilter | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!GOVERNANCE_APPROVAL_STATUS_FILTER_VALUES.has(trimmed as GovernanceApprovalStatusFilter)) {
    return null;
  }

  return trimmed as GovernanceApprovalStatusFilter;
}

export function governanceApprovalStatusFilterLabel(filter: GovernanceApprovalStatusFilter): string {
  switch (filter) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return filter;
  }
}

export function filterGovernanceApprovalsByStatusFilter(
  approvals: readonly GovernanceApprovalRequest[],
  filter: GovernanceApprovalStatusFilter | null,
): readonly GovernanceApprovalRequest[] {
  if (filter === null) {
    return approvals;
  }

  if (filter === "pending") {
    return approvals.filter((row) => isPendingStatus(row.status));
  }

  if (filter === "approved") {
    return approvals.filter((row) => isApprovedStatus(row.status));
  }

  return approvals.filter((row) => isRejectedStatus(row.status));
}