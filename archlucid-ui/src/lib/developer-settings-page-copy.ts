export const DEVELOPER_SETTINGS_PRIMARY_CONTENT_ID = "developer-settings-primary-content" as const;

export const DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID = "developer-settings-first-viewport" as const;

export const DEVELOPER_SETTINGS_SKIP_TARGET_ID = DEVELOPER_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const DEVELOPER_SETTINGS_SKIP_LINK_LABEL = "Skip to developer tools" as const;

export const DEVELOPER_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "developer-settings-header-claim-discipline" as const;

export const DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Evaluate branded themes and run an optional local CLI demo for internal support workflows." as const;

export function developerSettingsPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? DEVELOPER_SETTINGS_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
