/**
 * Canonical buyer-facing labels for governance approval (approval queue workflow).
 *
 * Replaces the legacy "resolve outcomes" jargon — see docs/library/UI_DESIGN_SYSTEM.md
 * and docs/ux-audits/INTERNAL_LEAKAGE_AUDIT.md (L08).
 */

/** Noun phrase for the governance approval workflow and its records. */
export const GOVERNANCE_APPROVAL_LABEL = "Governance approval" as const;

/** Job-router card on governance homes (verb-aligned with "Triage findings"). */
export const GOVERNANCE_APPROVAL_JOB_LABEL = "Process approvals" as const;

export const GOVERNANCE_APPROVAL_JOB_WHEN_TO_USE =
  "Use the Approval queue to submit reviews for governance approval and record authorized decisions." as const;

/** Primary submit CTA on the approval queue. */
export const GOVERNANCE_APPROVAL_SUBMIT_LABEL = "Submit for governance approval" as const;

/** Collapsible help trigger on the approval queue overview. */
export const GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL = "How governance approval works" as const;

/** Help topic label (approval queue contextual help). */
export const GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL = GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL;

/** Checklist final step on the submit card. */
export const GOVERNANCE_APPROVAL_SUBMIT_CHECKLIST_LABEL = GOVERNANCE_APPROVAL_SUBMIT_LABEL;

/** Forward CTA from review detail when approval is pending. */
export const GOVERNANCE_APPROVAL_REVIEW_DETAIL_CTA_LABEL = GOVERNANCE_APPROVAL_SUBMIT_LABEL;

/** Audit / pipeline event labels. */
export const GOVERNANCE_APPROVAL_EVENT_REQUESTED_LABEL = "Governance approval requested" as const;
export const GOVERNANCE_APPROVAL_EVENT_APPROVED_LABEL = "Governance approval approved" as const;
export const GOVERNANCE_APPROVAL_EVENT_REJECTED_LABEL = "Governance approval rejected" as const;
export const GOVERNANCE_APPROVAL_EVENT_RECORDED_LABEL = "Governance approval recorded" as const;
export const GOVERNANCE_APPROVAL_EVENT_COMPLETED_LABEL = "Governance approval completed" as const;

/** Cross-link helper copy. */
export const GOVERNANCE_APPROVAL_HELP_LINK_LABEL = "Governance approval help" as const;
export const GOVERNANCE_APPROVAL_OPEN_LINK_LABEL = "Open governance approval" as const;
export const GOVERNANCE_APPROVAL_VIEW_LINK_LABEL = "View governance approval" as const;
export const GOVERNANCE_APPROVAL_REQUEST_LABEL = "Governance approval request" as const;
export const GOVERNANCE_APPROVAL_WORKFLOW_LABEL = "Governance approval workflow" as const;
export const GOVERNANCE_APPROVAL_QUEUE_LINK_LABEL = "Approval queue" as const;
