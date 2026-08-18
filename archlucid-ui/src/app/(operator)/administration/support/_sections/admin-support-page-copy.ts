import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

export const ADMIN_SUPPORT_PAGE_TITLE = "Support" as const;

export const ADMIN_SUPPORT_PRIMARY_CONTENT_ID = "admin-support-primary-content" as const;

export const ADMIN_SUPPORT_SKIP_LINK_LABEL = "Skip to support workspace" as const;

export const ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const ADMIN_SUPPORT_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const ADMIN_SUPPORT_BREADCRUMB_TOPIC_TITLE = ADMIN_SUPPORT_PAGE_TITLE;

export const ADMIN_SUPPORT_PAGE_SUBTITLE_OPERATOR =
  "Contact ArchLucid support, gather redacted diagnostics, and follow guided troubleshooting paths." as const;

export const ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER =
  "Contact support, download redacted diagnostics when requested, and follow troubleshooting shortcuts." as const;

export function adminSupportPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER
    : ADMIN_SUPPORT_PAGE_SUBTITLE_OPERATOR;
}
