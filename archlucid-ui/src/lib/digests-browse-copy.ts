export const DIGESTS_PAGE_TITLE = "Architecture digests" as const;

export const DIGESTS_PAGE_SUBTITLE =
  "Configure the weekly sponsor digest for direct recipients. Architecture digests for subscription destinations are managed separately." as const;

export const DIGESTS_PAGE_SUBTITLE_BUYER =
  "Weekly sponsor digest for sponsor recipients in this workspace." as const;

export const DIGESTS_BROWSE_PAGE_SUBTITLE =
  "Send scheduled summaries of review activity, governance signals, findings, and advisory scans." as const;

export const DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER =
  "Scheduled summaries of review activity, governance signals, and findings." as const;

export function digestsBrowsePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER : DIGESTS_BROWSE_PAGE_SUBTITLE;
}

export function digestsSchedulePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? DIGESTS_PAGE_SUBTITLE_BUYER : DIGESTS_PAGE_SUBTITLE;
}

export const DIGESTS_HUB_PRIMARY_CONTENT_ID = "digests-hub-primary-content" as const;

export const DIGESTS_HUB_SKIP_LINK_LABEL = "Skip to architecture digests workspace" as const;

export const DIGESTS_HUB_BREADCRUMB_TOPIC_TITLE = DIGESTS_PAGE_TITLE;

export const DIGESTS_SCHEDULE_BREADCRUMB_TOPIC_TITLE = DIGESTS_SCHEDULE_TAB_LABEL;

export const DIGESTS_LAST_UPDATED_PREFIX = "Last updated" as const;

export const DIGESTS_HEALTH_CHECK_PREFIX = "Setup status checked" as const;

export const DIGESTS_BROWSE_TAB_BROWSE_LABEL = "Browse" as const;

export const DIGESTS_BROWSE_TAB_GET_STARTED_LABEL = "Get started" as const;

export const DIGESTS_SCHEDULE_TAB_LABEL = "Sponsor schedule" as const;

export const DIGESTS_PRIVACY_NOTE =
  "Digest emails include summaries and links back to ArchLucid. Sensitive evidence is excluded by default — configure inclusion on the Subscriptions tab." as const;

export const DIGESTS_PRIVACY_DETAILS_TRIGGER = "About digest content" as const;

export const DIGESTS_SCHEDULE_PREVIEW_LABEL = "Preview latest generated digest" as const;

export const DIGESTS_SCHEDULE_GENERATE_TEST_LABEL = "Generate architecture digest test" as const;

export const DIGESTS_BROWSE_SETUP_MESSAGE =
  "Complete schedule and recipient setup to start generating weekly digests." as const;
/**
 * StatusTag label for "nothing configured yet" on the digests hub.
 *
 * Matches the Schedule tab (`exec-digest-schedule-page-model`) and the ServiceNow /
 * Azure Boards integration surfaces. The page previously said "Setup needed" here,
 * "Setup incomplete" on Schedule, and "Action needed" on Subscriptions for states a
 * buyer reads as identical.
 */
export const DIGESTS_BROWSE_SETUP_STATUS_LABEL = "Setup incomplete" as const;

export const DIGESTS_BROWSE_NEXT_BEST_ACTION_PREFIX = "Next best action" as const;

export const DIGESTS_BROWSE_EMPTY_TITLE = "No digests generated yet" as const;

export const DIGESTS_BROWSE_EMPTY_DESCRIPTION =
  "After a schedule and recipients are configured, generated digests will appear here with delivery status and preview actions." as const;

export const DIGESTS_BROWSE_LOADING_LABEL = "Loading digest history…" as const;

/** Empty-state fallback when the health snapshot failed, so setup state is unknown. */
export const DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE = "No digest history in this scope" as const;

export const DIGESTS_BROWSE_SETUP_UNKNOWN_DESCRIPTION =
  "Setup status could not be read just now. Refresh to retry, or open advisory schedules to confirm a generation cadence is enabled." as const;

/**
 * Digests are produced by an advisory scan run — there is no on-demand
 * "send" endpoint on this surface, so the affordance is navigation, not an action.
 */
export const DIGESTS_BROWSE_GENERATE_FIRST_LABEL = "Generate the first digest" as const;

export const DIGESTS_BROWSE_GENERATE_FIRST_DETAIL =
  "Run an advisory scan to produce the first digest. Open Advisory schedules to manage cadence or start a scan." as const;

export const DIGESTS_BROWSE_GENERATE_FIRST_DETAIL_PREREQ =
  "Complete advisory scan schedule and subscriptions first, then run a scan to produce the first digest." as const;

export const DIGESTS_BROWSE_GENERATE_FIRST_DONE_DETAIL =
  "At least one digest has been generated." as const;

export const DIGESTS_BROWSE_HISTORY_PENDING_DETAIL =
  "No digests generated yet — generated digests appear in this list." as const;

export const DIGESTS_BROWSE_HISTORY_READY_DETAIL = "Digest history is available below." as const;

export const DIGESTS_BROWSE_INCLUDES_SECTION_TITLE = "What digests include" as const;

export const DIGESTS_BROWSE_INCLUDES_ITEMS = [
  "Review activity",
  "Governance signals",
  "Findings summary",
  "Advisory scan results",
  "Dashboard links",
] as const;

export const DIGESTS_BROWSE_CHECKLIST_TITLE = "Digest setup checklist" as const;

export const DIGESTS_BROWSE_CHECKLIST_LEAD =
  "Digests start flowing once a generation cadence and outbound recipients exist. Work these steps in order." as const;

export const DIGESTS_BROWSE_RECIPIENTS_HELPER =
  "Architecture digest subscriptions deliver scan summaries to workspace recipients. Sponsor recipients on the Schedule tab receive a separate sponsor rollup email." as const;

export const DIGESTS_BROWSE_PREVIEW_DISABLED_TITLE =
  "Configure a schedule or send a test digest first." as const;

export const DIGESTS_BROWSE_SEND_TEST_LABEL = "Send test digest" as const;

export const DIGESTS_BROWSE_SEND_TEST_TITLE =
  "Generates a test digest and delivers it to configured subscription recipients." as const;

export const DIGESTS_BROWSE_RELATED_ADVISORY_LABEL = "Open advisory schedules" as const;

export const DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL = "Check integration readiness" as const;

export const DIGESTS_CHECKLIST_SCHEDULE_LABEL = "Enable advisory scan schedule" as const;

export const DIGESTS_CHECKLIST_SCHEDULE_DETAIL_PENDING =
  "No enabled advisory scan schedules. Set generation cadence in Advisory schedules; the sponsor schedule controls only when the sponsor rollup email is sent." as const;

export const DIGESTS_CHECKLIST_RECIPIENTS_DETAIL_SUFFIX = "Add outbound recipients for delivery." as const;

export const DIGESTS_CHECKLIST_ACTION_OPEN_ADVISORY = DIGESTS_BROWSE_RELATED_ADVISORY_LABEL;

export const DIGESTS_CHECKLIST_ACTION_RUN_SCAN = "Run advisory scan" as const;

export const DIGESTS_CHECKLIST_ACTION_ADD_SUBSCRIPTIONS = "Add subscriptions" as const;

export const DIGESTS_CHECKLIST_ACTION_OPEN_SPONSOR = "Open sponsor schedule" as const;

export function digestsBrowseTabLabel(hasDigestHistory: boolean): string {
  return hasDigestHistory ? DIGESTS_BROWSE_TAB_BROWSE_LABEL : DIGESTS_BROWSE_TAB_GET_STARTED_LABEL;
}
