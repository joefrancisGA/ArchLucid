export const AI_USAGE_SETTINGS_PRIMARY_CONTENT_ID = "ai-usage-settings-primary-content" as const;

export const AI_USAGE_SETTINGS_FIRST_VIEWPORT_ID = "ai-usage-settings-first-viewport" as const;

export const AI_USAGE_SETTINGS_SKIP_TARGET_ID = AI_USAGE_SETTINGS_FIRST_VIEWPORT_ID;

export const AI_USAGE_SETTINGS_SKIP_LINK_LABEL = "Skip to AI usage workspace" as const;

export const AI_USAGE_SETTINGS_PAGE_DESCRIPTION_OPERATOR =
  "Monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace." as const;

export const AI_USAGE_SETTINGS_PAGE_DESCRIPTION_BUYER =
  "Review estimated AI spend, remaining budget, and workflow cost signals for this workspace." as const;

export function aiUsageSettingsPageDescription(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? AI_USAGE_SETTINGS_PAGE_DESCRIPTION_BUYER
    : AI_USAGE_SETTINGS_PAGE_DESCRIPTION_OPERATOR;
}
