/** Canonical `/governance/alerts` inbox copy — keep header, empty state, and disclosures aligned. */
export const ALERTS_PAGE_SUBTITLE =
  "Triage governance and architecture-risk signals from review findings.";

export const ALERTS_CONTEXT_NOTE =
  "Alerts appear when enabled rules detect findings that require acknowledgement, resolution, or governance review.";

export const ALERTS_HOW_ALERTS_WORK_LABEL = "How alerts work";

export const ALERTS_QUICK_GUIDANCE_BULLETS = [
  "Alerts are deduplicated across repeated evaluations.",
  "Each alert links to a finding in scope for triage.",
  "Acknowledge or resolve alerts when your role allows.",
] as const;

export const ALERTS_HOW_ALERTS_WORK_STEPS_OPERATOR = [
  "Finalize architecture reviews so findings exist for rules to evaluate.",
  "Open Standards and rules and create at least one enabled rule.",
  "Optional: use Routing to notify email or webhooks when a rule fires.",
  "Pick a status filter or refresh — rows appear after evaluations run.",
] as const;

export const ALERTS_HOW_ALERTS_WORK_STEPS_READER = [
  "Alerts appear when automated checks evaluate findings from completed reviews.",
  "Operators configure rules and routing on Standards and rules and Routing.",
  "Try another status filter — triage actions stay API-gated at your rank.",
] as const;

export const ALERTS_SUMMARY_OPEN_LABEL = "Open alerts";
export const ALERTS_SUMMARY_ACKNOWLEDGED_LABEL = "Acknowledged";
export const ALERTS_SUMMARY_RESOLVED_LABEL = "Resolved";
export const ALERTS_SUMMARY_BLOCKING_LABEL = "Blocking alerts";
export const ALERTS_SUMMARY_LAST_EVALUATED_LABEL = "Last evaluated";

export const ALERTS_EMPTY_HEALTHY_TITLE = "No open alerts";
export const ALERTS_EMPTY_HEALTHY_BODY =
  "All evaluated governance alerts are clear for the selected status.";

export const ALERTS_EMPTY_NO_REVIEWS_TITLE = "No alerts yet";
export const ALERTS_EMPTY_NO_REVIEWS_BODY =
  "Finalize a review package before alert rules can evaluate findings.";

export const ALERTS_EMPTY_NO_RULES_TITLE = "No alert rules configured";
export const ALERTS_EMPTY_NO_RULES_BODY =
  "Enable standards or rules to begin generating governance alerts.";

export const ALERTS_EMPTY_FILTERED_TITLE = "No alerts for this filter";
export const ALERTS_EMPTY_FILTERED_BODY =
  "Try another status or refresh after new evaluations.";

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES = "Open review packages";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW = "Start architecture review";
export const ALERTS_ACTION_OPEN_STANDARDS_AND_RULES = "Open standards and rules";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW = "Open governance workflow";

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF = "/reviews?projectId=default";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF = "/reviews/new";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF = "/governance";

export const ALERTS_HUB_TAB_STANDARDS_AND_RULES = "Standards and rules";
