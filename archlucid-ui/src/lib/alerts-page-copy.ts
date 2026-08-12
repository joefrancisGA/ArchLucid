import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";

/** Canonical `/governance/alerts` inbox copy — keep header, empty state, and disclosures aligned. */
export const ALERTS_PAGE_SUBTITLE =
  "Triage governance and architecture-risk signals from review findings.";

export const BUYER_ALERTS_PAGE_SUBTITLE =
  "Triage governance signals from review findings in your workspace.";

export const ALERTS_LAYER_GUIDANCE_TRIGGER = "About alert triage";

export const ALERTS_CONFIGURATION_LAYER_GUIDANCE_TRIGGER = "About alert rules";

export const ALERTS_CONFIGURE_RULES_LINK_LABEL = "Configure alert rules";

export function alertsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? BUYER_ALERTS_PAGE_SUBTITLE : ALERTS_PAGE_SUBTITLE;
}

export const ALERTS_CONTEXT_NOTE =
  "Alerts appear when enabled rules detect findings that require acknowledgement, resolution, or governance review.";

export const ALERTS_HOW_ALERTS_WORK_LABEL = "How alerts work";

/** Sentence case matches the sibling governance nav labels (Approval queue, Policy packs, Signed review records). */
export const ALERTS_CONFIGURATION_PAGE_TITLE = "Alert rules";

export const ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL = "Governance";

export const ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;

export const ALERTS_CONFIGURATION_PAGE_SUBTITLE =
  "Configure which review conditions generate alerts and where notifications are delivered.";

export const BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE =
  "Configure alert conditions and where notifications are delivered.";

export const ALERTS_CONFIGURATION_PAGE_SUBTITLE_OPERATOR = ALERTS_CONFIGURATION_PAGE_SUBTITLE;

export function alertsConfigurationPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? BUYER_ALERTS_CONFIGURATION_PAGE_SUBTITLE
    : ALERTS_CONFIGURATION_PAGE_SUBTITLE_OPERATOR;
}

export const ALERTS_CONFIGURATION_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const ALERTS_CONFIGURATION_ACTION_REFRESH = "Refresh" as const;

export const ALERTS_CONFIGURATION_ACTION_REFRESHING = "Refreshing…" as const;

export const ALERTS_CONFIGURATION_SCOPE_DETAILS_TRIGGER = "About alert configuration" as const;

export const ALERTS_OPEN_INBOX_LINK_LABEL = "Open alert inbox" as const;

export const ALERTS_OPEN_INBOX_LINK_HREF = "/governance/alerts" as const;

export const ALERTS_RULES_PAGE_SUBTITLE = ALERTS_CONFIGURATION_PAGE_SUBTITLE;

/** @deprecated Alert rules hub uses {@link ALERTS_RULES_PAGE_SUBTITLE}. */
export const ALERT_RULES_PAGE_SUBTITLE = ALERTS_RULES_PAGE_SUBTITLE;

export const ALERTS_SUMMARY_OPEN_LABEL = "Open alerts";
export const ALERTS_SUMMARY_ACKNOWLEDGED_LABEL = "Acknowledged";
export const ALERTS_SUMMARY_RESOLVED_LABEL = "Resolved";
/** @deprecated Blocking is nested under {@link ALERTS_SUMMARY_OPEN_LABEL} (TB-2107). */
export const ALERTS_SUMMARY_BLOCKING_LABEL = "Blocking alerts";
export const ALERTS_SUMMARY_LAST_EVALUATED_LABEL = "Last evaluated";

/** Explains that blocking is a severity subset of open — not a fourth lifecycle total (TB-2107). */
export const ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE =
  "Blocking counts open alerts with Critical or High severity. It is not added to the open total.";

export const ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED = "Rules not configured";
export const ALERTS_SUMMARY_LAST_EVALUATED_NEVER = "Never evaluated";

/** Visible sentinel when Open/Acknowledged/Resolved/Blocking are not measured (TB-2104). */
export const ALERTS_SUMMARY_COUNT_NOT_EVALUATED = "—";

/** Accessible name for count tiles when no alert rules exist (dash alone is not enough). */
export const ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA =
  "Not evaluated — no alert rules configured";

/** Accessible name when rules exist but no evaluation has run yet. */
export const ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA =
  "Not evaluated — alert rules have not run yet";

export const ALERTS_EMPTY_HEALTHY_TITLE = "No open alerts";
export const ALERTS_EMPTY_HEALTHY_BODY =
  "All evaluated governance alerts are clear for the selected status.";

export const ALERTS_EMPTY_NO_REVIEWS_TITLE = "No alerts yet";
export const ALERTS_EMPTY_NO_REVIEWS_BODY =
  "Finalize a review before alert rules can evaluate findings.";

export const ALERTS_EMPTY_NO_RULES_TITLE = "No alert rules configured";
export const ALERTS_EMPTY_NO_RULES_BODY =
  "Alert rules evaluate completed reviews and create inbox items when conditions match. Example: raise a Warning alert when critical and high-severity finding count reaches at least 3.";

export const ALERTS_EMPTY_FILTERED_TITLE = "No alerts for this filter";
export const ALERTS_EMPTY_FILTERED_BODY =
  "Try another status or refresh after new evaluations.";

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES = "Open reviews";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW = "Start architecture review";
/** @deprecated Use {@link ALERTS_CONFIGURE_RULES_LINK_LABEL} — one label for alerts + rules setup. */
export const ALERTS_ACTION_CONFIGURE_ALERT_RULES = ALERTS_CONFIGURE_RULES_LINK_LABEL;
export const ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE = "Open governance setup";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW = "Open governance workflow";

/** @deprecated Use {@link ALERTS_CONFIGURE_RULES_LINK_LABEL}. */
export const ALERTS_ACTION_OPEN_STANDARDS_AND_RULES = ALERTS_CONFIGURE_RULES_LINK_LABEL;

export const ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF = "/architecture/reviews";
export const ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF = "/architecture/reviews/new";
export const ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF = "/governance/setup";

/** @deprecated Inbox-only alerts surface — configuration tabs removed. */
export const ALERTS_HUB_TAB_STANDARDS_AND_RULES = "Alert rules";
