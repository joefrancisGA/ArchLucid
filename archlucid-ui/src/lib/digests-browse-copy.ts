export const DIGESTS_PAGE_TITLE = "Architecture digests" as const;

export const DIGESTS_PAGE_SUBTITLE =
  "Configure the weekly executive digest for direct recipients. Architecture digests for subscription destinations are managed separately." as const;

export const DIGESTS_PAGE_SUBTITLE_BUYER =
  "Weekly executive digest for sponsor recipients in this workspace." as const;

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

export const DIGESTS_LAST_UPDATED_PREFIX = "Last updated" as const;

export const DIGESTS_PRIVACY_NOTE =
  "Digest emails include summaries and links back to ArchLucid. Sensitive evidence content is not included unless explicitly configured." as const;

export const DIGESTS_PRIVACY_DETAILS_TRIGGER = "About digest content" as const;

export const DIGESTS_SCHEDULE_PREVIEW_LABEL = "Preview latest generated digest" as const;

export const DIGESTS_SCHEDULE_GENERATE_TEST_LABEL = "Generate architecture digest test" as const;

export const DIGESTS_BROWSE_SETUP_MESSAGE =
  "Complete schedule and recipient setup to start generating weekly digests." as const;
export const DIGESTS_BROWSE_SETUP_STATUS_LABEL = "Setup needed" as const;

export const DIGESTS_BROWSE_NEXT_BEST_ACTION_PREFIX = "Next best action" as const;

export const DIGESTS_BROWSE_EMPTY_TITLE = "No digests generated yet" as const;

export const DIGESTS_BROWSE_EMPTY_DESCRIPTION =
  "After a schedule and recipients are configured, generated digests will appear here with delivery status and preview actions." as const;

export const DIGESTS_BROWSE_INCLUDES_SECTION_TITLE = "What digests include" as const;

export const DIGESTS_BROWSE_INCLUDES_ITEMS = [
  "Review activity",
  "Governance signals",
  "Findings summary",
  "Advisory scan results",
  "Dashboard links",
] as const;

export const DIGESTS_BROWSE_CHECKLIST_TITLE = "Digest setup checklist" as const;

export const DIGESTS_BROWSE_RECIPIENTS_HELPER =
  "Architecture digest subscriptions deliver scan summaries to workspace recipients. Executive recipients on the Schedule tab receive a separate sponsor rollup email." as const;

export const DIGESTS_BROWSE_PREVIEW_DISABLED_TITLE =
  "Configure a schedule or send a test digest first." as const;

export const DIGESTS_BROWSE_SEND_TEST_LABEL = "Send test digest" as const;

export const DIGESTS_BROWSE_SEND_TEST_TITLE =
  "Generates a test digest and delivers it to configured subscription recipients." as const;

export const DIGESTS_BROWSE_RELATED_ADVISORY_LABEL = "Open advisory schedules" as const;

export const DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL = "Check integration readiness" as const;
