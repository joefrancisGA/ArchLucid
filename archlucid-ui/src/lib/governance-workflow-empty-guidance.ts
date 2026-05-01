import type { EmptyStateGettingStarted } from "@/components/EmptyState";

/** `/governance` — no run loaded yet. */
export const governanceWorkflowIdleGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Governance workflow in three moves",
  steps: [
    "Finalize a manifest on a review, then scroll to Submit for governance approval (source → target environments).",
    "Load that review under Approval requests — approve or reject rows as a reviewer.",
    "Promote approved requests, then Activate for the target environment when you are ready to go live.",
  ],
};

export const governanceWorkflowIdleGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What this page shows",
  steps: [
    "Operators pick a review and load approval requests, promotions, and activations for that run.",
    "Submitting, approving, promoting, and activating require Execute+ where your tenant expects it.",
    "Use Findings or Reviews for context — this timeline stays inspection-first at your rank.",
  ],
};

export const governanceNoApprovalsGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Next steps for this review",
  steps: [
    "If the manifest should move environments, submit an approval request using the card above.",
    "Otherwise pick another review that already has an open request.",
    "Ask reviewers to load this run — approvals appear here once submitted.",
  ],
};

export const governanceNoApprovalsGettingStartedReader: EmptyStateGettingStarted = {
  heading: "Why this can be empty",
  steps: [
    "No approval rows exist for this review yet — operators submit requests after finalize.",
    "Try another review from the picker, or coordinate with an operator to submit.",
    "You can still inspect promotions and activations below once the run has history.",
  ],
};

export const governancePromotionsEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "How promotions appear",
  steps: [
    "Approve a submitted request using Approve on its card.",
    "Click Promote on an approved row — that records the manifest moving toward the target.",
    "Repeat for each environment hop your process requires.",
  ],
};

export const governancePromotionsEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "Timeline insight",
  steps: [
    "Promotions show after operators approve and promote — empty means none yet for this review.",
    "Compare with Approval requests above to see pending work.",
    "Activations below confirm what landed in each environment.",
  ],
};

export const governanceActivationsEmptyGettingStartedOperator: EmptyStateGettingStarted = {
  heading: "Activate after promotion",
  steps: [
    "Promote first — activation binds the manifest to the target environment.",
    "Enter your audit-trail name, open Activate on a promotion card, and confirm.",
    "Refresh to see activation rows with timestamps for auditors.",
  ],
};

export const governanceActivationsEmptyGettingStartedReader: EmptyStateGettingStarted = {
  heading: "What activations mean",
  steps: [
    "Activations record which manifest version is live for an environment.",
    "Operators run Activate after promote — nothing shows until that completes.",
    "Use Audit log if you need the cross-run paper trail.",
  ],
};

/** `/governance/dashboard` placeholder until cross-review ships. */
export const governanceDashboardPlaceholderGettingStarted: EmptyStateGettingStarted = {
  heading: "What to use today",
  steps: [
    "Open Governance workflow to move a single review through submit → approve → promote → activate.",
    "Track findings and policy drift from Findings and Policy packs when approvals need evidence.",
    "Search Audit log for immutable records of who changed governance state and when.",
  ],
};
