import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import {
  IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const OIDC_SETTINGS_PRIMARY_CONTENT_ID = "oidc-settings-primary-content" as const;

export const OIDC_SETTINGS_FIRST_VIEWPORT_ID = "oidc-settings-first-viewport" as const;

export const OIDC_SETTINGS_FIRST_VIEWPORT_TEST_ID = OIDC_SETTINGS_FIRST_VIEWPORT_ID;

export const OIDC_SETTINGS_SKIP_TARGET_ID = OIDC_SETTINGS_FIRST_VIEWPORT_ID;

export const OIDC_SETTINGS_SKIP_LINK_LABEL = "Skip to OIDC status workspace" as const;

export const OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const OIDC_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const OIDC_SETTINGS_BREADCRUMB_HUB_LABEL = "Identity providers" as const;

export const OIDC_SETTINGS_BREADCRUMB_HUB_PATH = IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF;

export const OIDC_SETTINGS_BREADCRUMB_TOPIC_TITLE = IDENTITY_PROVIDERS_OIDC_PAGE_TITLE;
