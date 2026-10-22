export const DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID = "developer-settings-primary-content" as const;

export const DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID = "developer-settings-first-viewport" as const;

export const DEVELOPER_SETTINGS_SKIP_TARGET_ID = DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const DEVELOPER_SETTINGS_SKIP_LINK_LABEL = "Skip to developer tools" as const;

export const DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "developer-settings-header-claim-discipline" as const;

export const DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Evaluate branded themes and run an optional local CLI demo for internal support workflows." as const;

export const DEVELOPER_SETTINGS_PAGE_LEAD =
  "Internal-only diagnostics for branded theme evaluation and optional local CLI workflows — not a customer settings surface." as const;

export const DEVELOPER_SETTINGS_START_HERE_CARD_TITLE = "Start here" as const;

export const DEVELOPER_SETTINGS_BUYER_START_HERE_HELPER =
  "Review build identity below. Theme evaluation and CLI demo controls are hidden in buyer-polished shells — open the full internal workspace to run them." as const;

export function developerSettingsPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
