import { API_KEYS_PAGE_TITLE } from "@/lib/api-keys-settings-copy";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

export const API_KEYS_SETTINGS_PRIMARY_CONTENT_ID = "api-keys-settings-primary-content" as const;

export const API_KEYS_SETTINGS_SKIP_LINK_LABEL = "Skip to API keys workspace" as const;

export const API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const API_KEYS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const API_KEYS_SETTINGS_BREADCRUMB_TOPIC_TITLE = API_KEYS_PAGE_TITLE;

export const API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Rotate automation credentials, review recent key events, and follow approved integration guidance." as const;

export function apiKeysSettingsPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? API_KEYS_SETTINGS_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
