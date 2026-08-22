export const SETTINGS_MASTER_PRIMARY_CONTENT_ID = "settings-master-primary-content" as const;

export const SETTINGS_MASTER_SKIP_LINK_LABEL = "Skip to settings workspace" as const;

export const SETTINGS_MASTER_PAGE_DESCRIPTION_OPERATOR =
  "Manage workspace, approval, integration, security, billing, and support configuration." as const;

export const SETTINGS_MASTER_PAGE_DESCRIPTION_BUYER =
  "Search workspace, approval, integration, security, billing, and support destinations from one administration hub." as const;

export function settingsMasterPageDescription(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SETTINGS_MASTER_PAGE_DESCRIPTION_BUYER
    : SETTINGS_MASTER_PAGE_DESCRIPTION_OPERATOR;
}
