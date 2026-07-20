/** Canonical `/governance/alerts` inbox copy — keep header, empty state, and disclosures aligned. */
export const ALERTS_PAGE_SUBTITLE =
  "Triage governance and architecture-risk signals from review findings.";

export const ALERTS_CONTEXT_NOTE =
  "Alerts appear when enabled rules detect findings that require acknowledgement, resolution, or governance review.";

export const ALERTS_HOW_ALERTS_WORK_LABEL = "How alerts work";

export const ALERTS_CONFIGURATION_PAGE_TITLE = "Alerts";

export const ALERTS_CONFIGURATION_PAGE_SUBTITLE =
  "Configure which review conditions generate alerts and where notifications are delivered.";

export const ALERTS_RULES_PAGE_SUBTITLE = ALERTS_CONFIGURATION_PAGE_SUBTITLE;

/** @deprecated Alert rules hub uses {@link ALERTS_RULES_PAGE_SUBTITLE}. */
export const ALERT_RULES_PAGE_SUBTITLE = ALERTS_RULES_PAGE_SUBTITLE;

export const ALERTS_SUMMARY_OPEN_LABEL = "Open alerts";
export const ALERTS_SUMMARY_ACKNOWLEDGED_LABEL = "Acknowledged";
export const ALERTS_SUMMARY_RESOLVED_LABEL = "Resolved";
export const ALERTS_SUMMARY_BLOCKING_LABEL = "Blocking alerts";
export const ALERTS_SUMMARY_LAST_EVALUATED_LABEL = "Last evaluated";

export const ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED = "Rules not configured";
export const ALERTS_SUMMARY_LAST_EVALUATED_NEVER = "Never evaluated";

export const ALERTS_EMPTY_HEALTHY_TITLE = "No open alerts";
export const ALERTS_EMPTY_HEALTHY_BODY =
  "All evaluated governance alerts are clear for the selected status.";

export const ALERTS_EMPTY_NO_REVIEWS_TITLE = "No alerts yet";
export const ALERTS_EMPTY_NO_REVIEWS_BODY =
  "Finalize a review before alert rules can evaluate findings.";

export const ALERTS_EMPTY_NO_RULES_TITLE = "No alert rules configured";
export const ALERTS_EMPTY_NO_RULES_BODY =
  "Enable alert rules before governance alerts can be generated.";

export const ALERTS_EMPTY_FILTERED_TITLE = "No alerts for this filter";
export const ALERTS_EMPTY_FILTERED_BODY =
  "Try another status or refresh after new evaluations.";

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES = "Open reviews";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW = "Start architecture review";
export const ALERTS_ACTION_CONFIGURE_ALERT_RULES = "Configure alerts";
export const ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE = "Open governance setup guide";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW = "Open governance workflow";

/** @deprecated Use {@link ALERTS_ACTION_CONFIGURE_ALERT_RULES}. */
export const ALERTS_ACTION_OPEN_STANDARDS_AND_RULES = ALERTS_ACTION_CONFIGURE_ALERT_RULES;

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF = "/reviews?projectId=default";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF = "/reviews/new";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF = "/governance";
export const ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF = "/governance/first-30-days";

/** @deprecated Inbox-only alerts surface — configuration tabs removed. */
export const ALERTS_HUB_TAB_STANDARDS_AND_RULES = "Alert rules";
