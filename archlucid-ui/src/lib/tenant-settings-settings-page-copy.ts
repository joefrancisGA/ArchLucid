import { TENANT_SETTINGS_PAGE_SUBTITLE as TENANT_SETTINGS_PAGE_SUBTITLE_OPERATOR } from "@/lib/tenant-settings-page-copy";

export const TENANT_SETTINGS_SETTINGS_PRIMARY_CONTENT_ID = "tenant-settings-primary-content" as const;

export const TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID = "tenant-settings-first-viewport" as const;

export const TENANT_SETTINGS_SETTINGS_SKIP_TARGET_ID = TENANT_SETTINGS_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const TENANT_SETTINGS_SETTINGS_SKIP_LINK_LABEL = "Skip to workspace settings" as const;

export const TENANT_SETTINGS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "tenant-settings-header-claim-discipline" as const;

export const TENANT_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Review workspace scope, tenant defaults, and inherited review settings for procurement walkthroughs." as const;

export const TENANT_SETTINGS_SETTINGS_PAGE_LEAD =
  "Read-only summary of organization context, cost assumptions, and governance defaults for this workspace." as const;

export const TENANT_SETTINGS_SETTINGS_START_HERE_CARD_TITLE = "Start here" as const;

export const TENANT_SETTINGS_SETTINGS_BUYER_START_HERE_HELPER =
  "Scan scope and organization cards first. Save actions, support bundles, and advanced quality controls are hidden in buyer-polished shells." as const;

export function tenantSettingsPageSubtitle(buyerPolishedShell: boolean): string {
  if (buyerPolishedShell) {
    return TENANT_SETTINGS_PAGE_SUBTITLE_BUYER;
  }

  return TENANT_SETTINGS_PAGE_SUBTITLE_OPERATOR;
}
