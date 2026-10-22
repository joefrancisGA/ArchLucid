export const BASELINE_SETTINGS_PRIMARY_CONTENT_ID = "baseline-settings-primary-content" as const;

export const BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID = "baseline-settings-first-viewport" as const;

export const BASELINE_SETTINGS_SKIP_TARGET_ID = BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const BASELINE_SETTINGS_SKIP_LINK_LABEL = "Skip to baseline settings" as const;

export const BASELINE_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "baseline-settings-header-claim-discipline" as const;

export const BASELINE_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Set workspace baseline assumptions that drive time-saved and sponsor-report estimates. You can skip this now and update it later." as const;

export function baselineSettingsPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? BASELINE_SETTINGS_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
