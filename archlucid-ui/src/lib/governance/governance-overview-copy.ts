/** Canonical copy for the `/governance/approval-queue` overview landing page. */

import { TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK } from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

export const GOVERNANCE_OVERVIEW_PAGE_TITLE = "Approval queue";

export const GOVERNANCE_OVERVIEW_PAGE_LEAD =
  "Workspace approval status, pending approvals, recent decisions, and review-scoped approval workflow.";

export const BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD =
  "Pending approvals, recent decisions, and review-scoped workflow for your workspace.";

/** Cross-link to `/governance/dashboard`; the label must match that destination's own heading. */
export const GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL =
  TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label;

export function governanceOverviewPageLead(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD : GOVERNANCE_OVERVIEW_PAGE_LEAD;
}

/**
 * Historical alternate heading when a review was deep-linked into the approval queue.
 * The live page title stays {@link GOVERNANCE_OVERVIEW_PAGE_TITLE} so it matches the left-nav label.
 */
export const GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE = "Approval queue";

export const GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD =
  "Approval requests, releases, and activation history for the selected review.";

export const GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL = "Sample review context";

export const GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE =
  "Showing approval workflow for the Claims Intake sample review — illustrative demo data.";

export const GOVERNANCE_OVERVIEW_SAMPLE_OVERVIEW_LINE =
  "Sample workspace — counts and lists may use illustrative demo data until you load a live review.";

export const GOVERNANCE_OVERVIEW_SUBMIT_ACTION = "Submit review for approval";

export const GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT =
  "Select a review before submitting for resolve outcomes.";

export const GOVERNANCE_OVERVIEW_PENDING_ACTION = "View pending approvals";

/** Canonical CTA label for `/governance/findings` from the approval-queue overview. */
export const GOVERNANCE_OVERVIEW_FINDINGS_ACTION = "Open findings queue";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION = "Load selected review";

export const GOVERNANCE_OVERVIEW_BACK_ACTION = "Back to approval overview";

export const GOVERNANCE_OVERVIEW_SUMMARY_HEADING = "Approval summary";

export const GOVERNANCE_OVERVIEW_SUMMARY_SCOPE_LINE =
  "Workspace-scoped counts from workspace health and decisions-needed APIs.";

export const GOVERNANCE_OVERVIEW_SUMMARY_AUTHORITY_LINE =
  "Requesters cannot approve their own reviews (segregation of duties).";

export const GOVERNANCE_OVERVIEW_LAST_REFRESHED_PREFIX = "Last refreshed";

export const GOVERNANCE_OVERVIEW_METRIC_WINDOW_LABEL = "Current workspace";

export const GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL = "Pending approval requests";

export const GOVERNANCE_OVERVIEW_PENDING_APPROVALS_DEFINITION =
  "Approval requests awaiting an authorized decision";

export const GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL = "Approved reviews";

export const GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_DEFINITION =
  "Reviews with an approved decision in the recent-decisions list";

export const GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_LABEL = "Blocking findings";

export const GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_DEFINITION =
  "Open findings that block approval progress (unowned high-severity, stale, or awaiting evidence)";

export const GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_BREAKDOWN_HEADING = "Blocking findings breakdown";

export const GOVERNANCE_OVERVIEW_BLOCKING_UNOWNED_LABEL = "Unowned high-severity findings";

export const GOVERNANCE_OVERVIEW_BLOCKING_STALE_LABEL = "Stale findings";

export const GOVERNANCE_OVERVIEW_BLOCKING_AWAITING_EVIDENCE_LABEL = "Findings awaiting evidence";

export const GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL = "Recent decisions";

export const GOVERNANCE_OVERVIEW_RECENT_DECISIONS_DEFINITION =
  "Approval decisions recorded in the workspace decision history";

export const GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL = "Policy activations";

export const GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_DEFINITION =
  "Recent policy pack changes and activations in this workspace";

export const GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE = "Pending approvals";

export const GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE = "Recent decisions";

export const GOVERNANCE_OVERVIEW_NO_PENDING = "No approval requests are waiting for review.";

export const GOVERNANCE_OVERVIEW_NO_PENDING_TITLE = "No reviews are awaiting approval";

export const GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION =
  "Start by selecting a completed review above and submitting it into the approval workflow.";

export const GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT =
  "Your workspace has no active approval items yet — load a completed review to begin the approval lifecycle.";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE = "Load a review";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD =
  "Select a completed review to inspect approval requests, releases, and activation history.";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT = "Select a review to enable this action.";

export const GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS = [
  "Review",
  "Submit",
  "Pending approval",
  "Approved",
  "Released",
] as const;

export const GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER = "How resolve outcomes work";

export const GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION =
  "Start from pending approvals or open the findings queue to clear blocking items.";
