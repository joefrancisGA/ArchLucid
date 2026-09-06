import type { EmptyStateGettingStarted } from "@/components/EmptyState";

/** `/governance` — no review selected yet in the workflow picker. */
export const governanceWorkflowIdleGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Approval workflow in three moves",
  steps: [
    "Finalize a review on a review, then scroll to Submit for approval (source → target environments).",
    "Load that review under Approval requests — approve or reject rows as a reviewer.",
    "Release approved requests to the target environment, then Activate when you are ready to go live.",
  ],
};

export const governanceWorkflowIdleGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What this page shows",
  steps: [
    "Approval leads pick a review and load approval requests, environment releases, and activations for that review.",
    "Each step follows your organization's role policy for who may submit, approve, release, and activate.",
    "Use Findings or Reviews for context — this timeline stays inspection-first at your rank.",
  ],
};

export const governanceNoApprovalsGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Next steps for this review",
  steps: [
    "If the finalized review record should move environments, submit an approval request using the card above.",
    "Otherwise pick another review that already has an open request.",
    "Ask reviewers to load this review — approvals appear here once submitted.",
  ],
};

export const governanceNoApprovalsGettingStartedReader: EmptyStateGettingStarted = {
  heading: "Why this can be empty",
  steps: [
    "No approval rows exist for this review yet — approval leads submit requests after finalize.",
    "Try another review from the picker, or coordinate with an approval lead to submit.",
    "You can still inspect environment releases and activations below once the review has history.",
  ],
};

export const governancePromotionsEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "How environment releases appear",
  steps: [
    "Approve a submitted request using Approve on its card.",
    "Click Release to environment on an approved row — that records the finalized review record moving toward the target.",
    "Repeat for each environment hop your process requires.",
  ],
};

export const governancePromotionsEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "Timeline insight",
  steps: [
    "Environment releases show after approvers release to the target environment — empty means none yet for this review.",
    "Compare with Approval requests above to see pending work.",
    "Activations below confirm what landed in each environment.",
  ],
};

export const governanceActivationsEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Activate after environment release",
  steps: [
    "Release to the target environment first — activation binds the finalized review record to that environment.",
    "Enter your audit-trail name, open Activate on a environment release card, and confirm.",
    "Refresh to see activation rows with timestamps for auditors.",
  ],
};

export const governanceActivationsEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What activations mean",
  steps: [
    "Activations record which finalized review record version is live for an environment.",
    "An approval lead runs Activate after an environment release — nothing shows until that completes.",
    "Use Audit trail if you need the portfolio-level paper trail.",
  ],
};

/** `/governance/dashboard` placeholder until cross-review ships. */
export const governanceDashboardPlaceholderGettingStarted: EmptyStateGettingStarted = {
  heading: "What to use today",
  steps: [
    "Open approval workflow to move a single review through submit → approve → release → activate.",
    "Track findings and policy drift from Findings and Policy packs when approvals need evidence.",
    "Search Audit trail for immutable records of who changed approval state and when.",
  ],
};
