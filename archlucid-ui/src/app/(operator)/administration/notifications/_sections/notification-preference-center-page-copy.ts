import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE } from "@/lib/notification-preference-center";

export const NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID =
  "notification-preference-center-primary-content" as const;

export const NOTIFICATION_PREFERENCE_CENTER_SKIP_LINK_LABEL = "Skip to notifications workspace" as const;

export const NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const NOTIFICATION_PREFERENCE_CENTER_BREADCRUMB_TOPIC_TITLE = NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE;

export const NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR =
  "Could not load channel status for this workspace. Try again in a moment." as const;

export const NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR_RETRY_LABEL = "Try again" as const;

export const NOTIFICATION_PREFERENCE_CENTER_LOADING_STATUS = "Loading notification channel status…" as const;
