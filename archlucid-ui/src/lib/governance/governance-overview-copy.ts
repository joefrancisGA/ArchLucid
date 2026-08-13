/** Canonical copy for the `/governance/approval-queue` overview landing page. */
export const GOVERNANCE_OVERVIEW_PAGE_TITLE = "Approval queue";

export const GOVERNANCE_OVERVIEW_PAGE_LEAD =
  "Workspace governance status, pending approvals, recent decisions, and review-scoped approval workflow.";

export const BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD =
  "Pending approvals, recent decisions, and review-scoped workflow for your workspace.";

export const GOVERNANCE_OVERVIEW_WORKSPACE_HEALTH_LINK_LABEL = "Workspace overview";

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
  "Showing governance workflow for the Claims Intake sample review — illustrative demo data.";

export const GOVERNANCE_OVERVIEW_SUBMIT_ACTION = "Submit review for approval";

export const GOVERNANCE_OVERVIEW_PENDING_ACTION = "View pending approvals";

export const GOVERNANCE_OVERVIEW_RISK_REGISTER_ACTION = "Open risk register";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION = "Load selected review";

export const GOVERNANCE_OVERVIEW_BACK_ACTION = "Back to governance overview";

export const GOVERNANCE_OVERVIEW_SUMMARY_HEADING = "Governance summary";

export const GOVERNANCE_OVERVIEW_PENDING_APPROVALS_LABEL = "Pending approval requests";

export const GOVERNANCE_OVERVIEW_APPROVED_PACKAGES_LABEL = "Approved reviews";

export const GOVERNANCE_OVERVIEW_BLOCKING_ALERTS_LABEL = "Blocking governance alerts";

export const GOVERNANCE_OVERVIEW_RECENT_DECISIONS_LABEL = "Recent decisions";

export const GOVERNANCE_OVERVIEW_POLICY_ACTIVATIONS_LABEL = "Policy activations";

export const GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE = "Pending approvals";

export const GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE = "Recent decisions";

export const GOVERNANCE_OVERVIEW_NO_PENDING = "No approval requests are waiting for review.";

export const GOVERNANCE_OVERVIEW_NO_PENDING_TITLE = "No reviews are awaiting approval";

export const GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION =
  "Start by selecting a completed review below and submitting it into the governance workflow.";

export const GOVERNANCE_OVERVIEW_IDLE_WORKSPACE_HINT =
  "Your workspace has no active governance items yet — load a completed review to begin the approval lifecycle.";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE = "Load a review";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD =
  "Select a completed review to inspect approval requests, releases, and activation history.";

export const GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT = "Select a review to enable this action.";

export const GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_HEADING = "First-time approval checklist";

export const GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_LEAD =
  "Use this sequence the first time you move a finalized review record through approval. Skipping steps is fine once your team knows the rhythm.";

export const GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS = [
  "Review",
  "Submit",
  "Pending approval",
  "Approved",
  "Released",
] as const;

export const GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER = "How governance approvals work";

export const GOVERNANCE_OVERVIEW_HEADER_NEXT_ACTION =
  "Start from pending approvals or open the risk register to clear blocking items.";
