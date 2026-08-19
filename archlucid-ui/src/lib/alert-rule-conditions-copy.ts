/** Buyer-facing copy for `/governance/alert-rules` Conditions tab (TB-936). */

/** Hub tab lead (`AlertRulesHubClient` rules subtitle) owns first-viewport orientation — do not restack PAGE_LEAD here (TB-1585). */
export const ALERT_RULES_CONDITIONS_PAGE_LEAD =
  "Define when completed architecture reviews should raise an alert in your workspace.";

/** Field help under Condition type — carries findings + notification-delivery honesty formerly in a stacked tab lead (TB-1585). */
export const ALERT_RULES_RULE_TYPE_HELP =
  "Evaluates findings from completed reviews. Saving a condition does not configure external notification delivery.";

/** Canonical rules-tab label — keep aligned with {@link ALERT_RULES_SECTION_HEADING} and empty titles. */
export const ALERT_RULES_TAB_LABEL = "Conditions";

/** Section heading when persisted alert rules exist (distinct from the hub page title row). */
export const ALERT_RULES_SECTION_HEADING = ALERT_RULES_TAB_LABEL;

export const ALERT_RULES_LIST_HEADING = "Configured alert rules";

export const ALERT_RULES_LIST_EMPTY_TITLE = "No alert rules yet";

export const ALERT_RULES_LIST_EMPTY_BODY =
  "Create an alert rule to raise notifications when review findings cross your thresholds.";

/** Header posture on the rules tab before any alert rules exist in the workspace. */
export const ALERT_RULES_POSTURE_NOT_CONFIGURED_LABEL = "No conditions configured";

/** Header metadata when the workspace has never persisted an alert rule. */
export const ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL = "Alert rules never configured in this workspace";

/** Visible reason when the Test alerts hub tab is disabled with zero rules. */
export const ALERT_RULES_TEST_ALERTS_TAB_DISABLED_REASON =
  "Create at least one alert rule before testing alerts.";

export const ALERT_RULES_CREATE_HEADING = "Create alert rule";

export const ALERT_RULES_EDIT_HEADING = "Edit alert rule";

/** Names what the field sets, so the help text no longer has to disclaim finding severity. */
export const ALERT_RULES_ALERT_PRIORITY_LABEL = "Priority of the raised alert";

export const ALERT_RULES_ALERT_PRIORITY_HELP =
  "Does not change the severity of the underlying findings.";

export const ALERT_RULES_RULE_TYPE_LABEL = "Condition type";

export const ALERT_RULES_NAME_LABEL = "Rule name";

export const ALERT_RULES_PREVIEW_HEADING = "Rule preview";

/**
 * The preview restates the unsaved form, so it must not read as a configured rule
 * while the list beside it is empty.
 */
export const ALERT_RULES_PREVIEW_DRAFT_STATUS_LABEL = "Draft — not saved";

export const ALERT_RULES_PREVIEW_DRAFT_STATUS_TITLE =
  "This preview describes the form below. No rule is saved until you select Create rule.";

/** Named scope beside the create control; a rule saved to the wrong workspace cannot be undone in the UI. */
export const ALERT_RULES_CREATE_SCOPE_PREFIX = "Applies to workspace";

export const ALERT_RULES_CREATE_BLOCKED_HINT = "Add a rule name and threshold to continue.";

export const ALERT_RULES_SCOPE_HEADING = "Review scope";

export const ALERT_RULES_NOTIFICATION_READINESS_HEADING = "Notification readiness";

export const ALERT_RULES_NOTIFICATION_IN_APP_ENABLED = "In-app alerts: enabled for active rules";

export const ALERT_RULES_NOTIFICATION_IN_APP_DISABLED = "In-app alerts: paused while the rule is disabled";

export const ALERT_RULES_NOTIFICATION_EXTERNAL_CONFIGURED =
  "External notifications: destinations configured on the Notifications tab";

export const ALERT_RULES_NOTIFICATION_EXTERNAL_NOT_CONFIGURED =
  "External notifications: not configured yet — add a destination on the Notifications tab";

export const ALERT_RULES_NOTIFICATIONS_TAB_LINK_LABEL = "Open Notifications tab";

export const ALERT_RULES_HOW_ALERTS_WORK =
  "Active rules evaluate completed reviews and raise alerts in the Alerts inbox. Use the Notifications tab to deliver alerts outside ArchLucid.";

export const ALERT_RULES_SAMPLE_MODE_BANNER =
  "Alert configuration is unavailable in the sample workspace.";

export const ALERT_RULES_SAMPLE_MODE_CTA_LABEL = "Start an evaluation";

export const ALERT_RULES_SAMPLE_MODE_CTA_HREF = "/get-started";

export const ALERT_RULES_CREATE_PENDING_LABEL = "Creating rule…";

export const ALERT_RULES_CREATE_SUCCESS_MESSAGE = "Alert rule created.";

export const ALERT_RULES_CREATE_BUTTON_LABEL = "Create rule";

export const ALERT_RULES_SIMULATE_BUTTON_LABEL = "Test rule";

export const ALERT_RULES_REFRESH_BUTTON_LABEL = "Refresh list";

export const ALERT_RULES_LAST_TRIGGER_UNKNOWN = "Not triggered yet";

export const ALERT_RULES_FORM_SECTION_ARIA_LABEL = "Alert rule form";

export const ALERT_RULES_STATUS_LIVE_REGION_LABEL = "Alert rule status";
