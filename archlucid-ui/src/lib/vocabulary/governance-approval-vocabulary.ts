/**
 * Canonical buyer-facing labels for approval (approval queue workflow).
 *
 * Replaces the legacy "resolve outcomes" jargon — see docs/library/UI_DESIGN_SYSTEM.md
 * and docs/ux-audits/INTERNAL_LEAKAGE_AUDIT.md (L08).
 */

/** Noun phrase for the approval workflow and its records. */
export const GOVERNANCE_APPROVAL_LABEL = "Approval" as const;

/** Job-router card on governance homes (verb-aligned with "Triage findings"). */
export const GOVERNANCE_APPROVAL_JOB_LABEL = "Process approvals" as const;

export const GOVERNANCE_APPROVAL_JOB_WHEN_TO_USE =
  "Use the Approval queue to submit reviews for approval and record authorized decisions." as const;

/** Primary submit CTA on the approval queue. */
export const GOVERNANCE_APPROVAL_SUBMIT_LABEL = "Submit for approval" as const;

/** Collapsible help trigger on the approval queue overview. */
export const GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL = "How approval works" as const;

/** Help topic label (approval queue contextual help). */
export const GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL = GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL;

/** Checklist final step on the submit card. */
export const GOVERNANCE_APPROVAL_SUBMIT_CHECKLIST_LABEL = GOVERNANCE_APPROVAL_SUBMIT_LABEL;

/** Forward CTA from review detail when approval is pending. */
export const GOVERNANCE_APPROVAL_REVIEW_DETAIL_CTA_LABEL = GOVERNANCE_APPROVAL_SUBMIT_LABEL;

/** Audit / pipeline event labels. */
export const GOVERNANCE_APPROVAL_EVENT_REQUESTED_LABEL = "Approval requested" as const;
export const GOVERNANCE_APPROVAL_EVENT_APPROVED_LABEL = "Approval approved" as const;
export const GOVERNANCE_APPROVAL_EVENT_REJECTED_LABEL = "Approval rejected" as const;
export const GOVERNANCE_APPROVAL_EVENT_RECORDED_LABEL = "Approval recorded" as const;
export const GOVERNANCE_APPROVAL_EVENT_COMPLETED_LABEL = "Approval completed" as const;

/** Cross-link helper copy. */
export const GOVERNANCE_APPROVAL_HELP_LINK_LABEL = "Approval help" as const;
export const GOVERNANCE_APPROVAL_OPEN_LINK_LABEL = "Open approval" as const;
export const GOVERNANCE_APPROVAL_VIEW_LINK_LABEL = "View approval" as const;
export const GOVERNANCE_APPROVAL_REQUEST_LABEL = "Approval request" as const;
export const GOVERNANCE_APPROVAL_WORKFLOW_LABEL = "Approval workflow" as const;
export const GOVERNANCE_APPROVAL_QUEUE_LINK_LABEL = "Approval queue" as const;
