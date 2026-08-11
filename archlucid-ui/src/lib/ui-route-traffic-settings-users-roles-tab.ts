import { SETTINGS_USERS_ROLES_TAB_PATH } from "@/lib/settings-admin-route-paths";

/**
 * Traffic workbook row ID for Users and roles Roles tab.
 * Owner backlog shorthand: SER (template formerly SRX).
 */
export const SETTINGS_USERS_ROLES_TAB_TRAFFIC_ROW_ID = "SER";

/** Canonical path tracked on the SER workbook row. */
export const SETTINGS_USERS_ROLES_TAB_TRAFFIC_PATH = SETTINGS_USERS_ROLES_TAB_PATH;

/** Workbook Section column value - query-tab on Users and roles hub. */
export const SETTINGS_USERS_ROLES_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for SER - Roles tab UX pass (2026-08-09).
 * ASCII-only for Windows console note scripts.
 */
export const SETTINGS_USERS_ROLES_TAB_TRAFFIC_NOTE =
  "Users and roles Roles tab (Tab surface) - inherits AUX hub Evidence chrome (SettingsRolesPageView PageContextualHelpButton + Category-1 registry on /administration/users; Sources follow-up chrome removed (TB-2092) above tabs). SettingsRolesPageView syncs ?tab=roles via router.replace; mounts roles matrix + assignable roles. Sibling SSU = users; AUX = hub. Template SRX renamed to SER to match owner.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
