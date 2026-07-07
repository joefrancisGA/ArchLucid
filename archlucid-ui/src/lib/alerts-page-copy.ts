/** Canonical `/governance/alerts` inbox copy — keep header, empty state, and disclosures aligned. */
export const ALERTS_PAGE_SUBTITLE =
  "Triage open governance and architecture-risk signals tied to review findings.";

export const ALERTS_APPROVAL_QUEUE_GUIDANCE =
  "Review pending approvals and clear blocking risk items before audit.";

export const ALERTS_ABOUT_SUMMARY_LABEL = "About alerts";

export const ALERTS_HOW_ALERTS_WORK_LABEL = "How alerts work";

export const ALERTS_QUICK_GUIDANCE_BULLETS = [
  "Alerts are deduplicated.",
  "Each alert links to a finding in scope.",
  "Users can acknowledge or resolve alerts when their role allows.",
] as const;

export const ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR = [
  "Finish architecture reviews so findings exist for rules to evaluate.",
  "Open the Rules tab and create at least one enabled rule.",
  "Optional: Use Routing to notify email or webhooks when a rule fires.",
  "Pick a status filter or refresh — rows appear after evaluations run.",
] as const;

export const ALERTS_HOW_ALERTS_WORK_STEPS_READER = [
  "Alerts appear when automated checks evaluate findings from completed reviews.",
  "Operators configure rules and routing on the Rules and Routing tabs.",
  "Try another status filter — triage actions stay API-gated at your rank.",
] as const;

export const ALERTS_EMPTY_STATE_TITLE = "No open alerts";

export const ALERTS_EMPTY_STATE_BODY =
  "This workspace has no open governance alerts for the selected status.";

export const ALERTS_EMPTY_STATE_PRIMARY_ACTION = "Continue to reviews";

export const ALERTS_EMPTY_STATE_PRIMARY_HREF = "/reviews?projectId=default";
