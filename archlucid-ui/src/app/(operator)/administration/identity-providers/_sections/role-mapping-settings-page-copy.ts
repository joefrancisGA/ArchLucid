import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import {
  IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID = "role-mapping-settings-primary-content" as const;

export const ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL = "Skip to role mapping workspace" as const;

export const ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const ROLE_MAPPING_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_LABEL = "Identity providers" as const;

export const ROLE_MAPPING_SETTINGS_BREADCRUMB_HUB_PATH = IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF;

export const ROLE_MAPPING_SETTINGS_BREADCRUMB_TOPIC_TITLE = IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE;

export const ROLE_MAPPING_SETTINGS_LOAD_ERROR_RETRY_LABEL = "Try again" as const;
