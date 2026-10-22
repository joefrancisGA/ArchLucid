import type { GovernanceApprovalWorkflowPhase } from "@/app/(operator)/governance/_sections/governance-approval-workflow-state";

/** Section heading for review-scoped approval request history on `/governance`. */
export const GOVERNANCE_APPROVAL_REQUESTS_SECTION_TITLE = "Approval requests";

export const GOVERNANCE_APPROVAL_REQUESTS_SECTION_LEAD =
  "Formal requests submitted for approval. Each approved or rejected request becomes an audit-trail decision tied to this review.";

export const GOVERNANCE_APPROVAL_REQUESTS_COMPACT_SECTION_LEAD =
  "Supporting approval request for the approval decision above — the audit trail retains the full submit → review → approve sequence.";

export const GOVERNANCE_APPROVAL_DECISION_RECORD_TITLE = "Approval decision";

export const GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS =
  "No approval requests recorded for this review yet. Submit a request after finalize to start the approval path.";

export const GOVERNANCE_WORKFLOW_OUTCOME_PENDING =
  "Approval request pending review — the decision is recorded in the audit trail when a reviewer approves or rejects.";

export const GOVERNANCE_WORKFLOW_OUTCOME_APPROVED =
  "Approval decision recorded — inspect the supporting request history below and the audit trail for evidence.";

export const GOVERNANCE_WORKFLOW_OUTCOME_REJECTED =
  "Latest approval request was rejected — submit a new request or review the decision in the audit trail.";

export const GOVERNANCE_WORKFLOW_OUTCOME_MIXED =
  "Multiple approval requests on this review — inspect each row for status and audit linkage.";

/** @returns Outcome strip copy for review context, or null when no strip should render. */
export function governanceWorkflowOutcomeLineForPhase(phase: GovernanceApprovalWorkflowPhase): string | null {
  switch (phase) {
    case "no_review":
    case "loading":
    case "approved":
      return null;
    case "no_requests":
      return GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS;
    case "pending":
      return GOVERNANCE_WORKFLOW_OUTCOME_PENDING;
    case "rejected":
      return GOVERNANCE_WORKFLOW_OUTCOME_REJECTED;
    case "mixed":
      return GOVERNANCE_WORKFLOW_OUTCOME_MIXED;
    default: {
      const exhaustive: never = phase;

      return exhaustive;
    }
  }
}
