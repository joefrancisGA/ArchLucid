import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";

/** Tab label — role assignment job, not credential lifecycle (TB-1931). */
export const SETTINGS_ROLES_KEYS_TAB_LABEL = "API key roles";

/** Card title on the keys tab panel. */
export const SETTINGS_ROLES_KEYS_TAB_CARD_TITLE = "API key roles";

/** Lead copy clarifies this tab assigns roles; host credential lifecycle stays in CLI usage help. */
export const SETTINGS_ROLES_KEYS_TAB_LEAD =
  "Assign built-in roles to automation API keys in this workspace. Create, rotate, and revoke host credentials using deployment settings — see";

export const SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF = API_KEYS_SETTINGS_CANONICAL_PATH;

export const SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_LINK_LABEL = "CLI usage help";

/** Primary empty-path CTA — host credential guidance lives in CLI usage help (TB-1213). */
export const SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL = "Open CLI usage help";
