import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import {
  IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF,
  IDENTITY_PROVIDERS_SAML_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const SAML_SETTINGS_PRIMARY_CONTENT_ID = "saml-settings-primary-content" as const;

export const SAML_SETTINGS_FIRST_VIEWPORT_ID = "saml-settings-first-viewport" as const;

export const SAML_SETTINGS_FIRST_VIEWPORT_TEST_ID = SAML_SETTINGS_FIRST_VIEWPORT_ID;

export const SAML_SETTINGS_SKIP_TARGET_ID = SAML_SETTINGS_FIRST_VIEWPORT_ID;

export const SAML_SETTINGS_SKIP_LINK_LABEL = "Skip to SAML configuration workspace" as const;

export const SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const SAML_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const SAML_SETTINGS_BREADCRUMB_HUB_LABEL = "Identity providers" as const;

export const SAML_SETTINGS_BREADCRUMB_HUB_PATH = IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF;

export const SAML_SETTINGS_BREADCRUMB_TOPIC_TITLE = IDENTITY_PROVIDERS_SAML_PAGE_TITLE;
