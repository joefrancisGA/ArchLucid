import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

export const GOVERNANCE_ACTION_REGION_TITLE = "Take governance action";

export const GOVERNANCE_ACTION_REGION_LEAD =
  "Assign remediation, record disposition, create an exception, or connect the finding to external work tracking.";

export const REMEDIATION_OWNER_LABEL = "Remediation owner";

export const REMEDIATION_OWNER_HELP =
  "Enter a recognized user ID or email. ArchLucid resolves the identity when saving the assignment.";

export const EXCEPTION_OWNER_LABEL = "Exception owner";

export const EXCEPTION_OWNER_HELP =
  "Enter a recognized user ID or email for the risk exception owner.";

export const EVIDENCE_REFERENCE_LABEL = "Evidence reference";

export const EVIDENCE_REFERENCE_HELP =
  "Artifact URI, ticket ID, audit correlation ID, or signed review citation that supports this exception.";

export const EXPIRATION_LABEL = "Expiration (local time)";

export const EXPIRATION_HELP =
  "Stored in UTC. The Finalized review record is not modified — expiration applies to the exception only.";

export function remediationAssignmentTransitionCopy(): string {
  return "Records assignee and due date for ITSM sync. Reversible by updating or clearing the assignment. Audit history is recorded.";
}

export function dispositionTransitionCopy(disposition: FindingDispositionKind): string {
  const base = "Appends a disposition event to the audit trail. The Finalized review record is not automatically changed.";

  if (disposition === "Remediated") {
    return `${base} Monitoring may continue per review acceptance criteria.`;
  }

  if (disposition === "Deferred") {
    return `${base} Sets a revisit date for governance follow-up.`;
  }

  if (disposition === "NeedsEvidence") {
    return `${base} Requests additional evidence before closure.`;
  }

  return base;
}

export function markRemediatedTransitionCopy(): string {
  return "Transitions disposition to Remediated. Requires rationale when provided. Does not close monitoring automatically — confirm acceptance criteria in the review record. Reversible with a new disposition.";
}

export function createWaiverTransitionCopy(): string {
  return "Creates a time-bounded risk exception with owner and evidence reference. Recorded in audit history. Revocable before expiration. Does not alter the Finalized review record.";
}

export function validateRemediationOwnerInput(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length < 3) {
    return "Enter a valid user ID or email (at least 3 characters).";
  }

  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const guidLike = /^[0-9a-f-]{8,}$/i.test(trimmed);

  if (!emailLike && !guidLike && !trimmed.includes("@")) {
    return "Use a recognized email address or user identifier.";
  }

  return null;
}
