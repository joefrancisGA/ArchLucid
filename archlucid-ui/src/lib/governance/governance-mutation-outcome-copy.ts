export const GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE = "Resolve outcomes recorded.";

export const GOVERNANCE_QUICK_APPROVE_FAILURE_MESSAGE = "Quick approve failed.";

export const GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED =
  "Enter a shared reason before applying a bulk disposition.";

export function governanceBulkDispositionSuccessMessage(
  processedCount: number,
  disposition: "Accepted" | "RejectedAsNotApplicable" | "Deferred",
): string {
  const label =
    disposition === "RejectedAsNotApplicable"
      ? "waived"
      : disposition === "Deferred"
        ? "deferred"
        : "accepted";

  return `Marked ${processedCount} finding(s) as ${label}.`;
}

export const GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE = "Failed to apply bulk disposition.";

export const GOVERNANCE_WORKFLOW_LOAD_REVIEW_REQUIRED =
  "Choose a review to load approval data.";

export const GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS = "Approval request submitted.";

export const GOVERNANCE_WORKFLOW_REVIEWED_BY_REQUIRED = "Reviewed by is required.";

export const GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS = "Request approved.";

export const GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS = "Request rejected.";

export const GOVERNANCE_WORKFLOW_ACTIVATE_AUDIT_NAME_REQUIRED =
  "Enter your name for the audit trail before activating.";

export function governanceWorkflowActivateSuccessMessage(manifestVersion: string, environment: string): string {
  return `Activated ${manifestVersion} for ${environment}.`;
}

export function policyPackPublishSuccessMessage(version: string): string {
  const trimmed = version.trim();

  if (trimmed.length === 0) {
    return "Policy pack version published.";
  }

  return `Policy pack version ${trimmed} published.`;
}
