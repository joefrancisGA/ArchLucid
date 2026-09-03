import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import {
  IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

export const DIAGNOSTICS_SETTINGS_PRIMARY_CONTENT_ID = "diagnostics-settings-primary-content" as const;

export const DIAGNOSTICS_SETTINGS_SKIP_LINK_LABEL = "Skip to identity diagnostics workspace" as const;

export const DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const DIAGNOSTICS_SETTINGS_BREADCRUMB_ADMINISTRATION_PATH = SETTINGS_ROOT_PATH;

export const DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_LABEL = "Identity providers" as const;

export const DIAGNOSTICS_SETTINGS_BREADCRUMB_HUB_PATH = IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF;

export const DIAGNOSTICS_SETTINGS_BREADCRUMB_TOPIC_TITLE = IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_TITLE = "Support tooling" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_INTRO =
  "Advanced configuration references and token test mapping are available in internal support environments." as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_PREFIX =
  "To validate role mapping safely, open" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CUSTOMER_TOOLS_ROLE_MAPPING_SUFFIX =
  "or contact your ArchLucid administrator." as const;
