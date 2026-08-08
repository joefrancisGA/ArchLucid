import { SETTINGS_USERS_KEYS_TAB_PATH } from "@/lib/settings-admin-route-paths";

/**
 * Traffic workbook row ID for Users and roles API keys tab.
 * Owner backlog shorthand: SEU (template formerly SEK).
 */
export const SETTINGS_USERS_KEYS_TAB_TRAFFIC_ROW_ID = "SEU";

/** Canonical path tracked on the SEU workbook row. */
export const SETTINGS_USERS_KEYS_TAB_TRAFFIC_PATH = SETTINGS_USERS_KEYS_TAB_PATH;

/** Workbook Section column value - query-tab on Users and roles hub. */
export const SETTINGS_USERS_KEYS_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for SEU - documents Evidence chrome inherited from AUX hub on API keys tab.
 * ASCII-only for Windows console note scripts.
 */
export const SETTINGS_USERS_KEYS_TAB_TRAFFIC_NOTE =
 "Users and roles API keys tab (Tab surface) - inherits AUX hub Evidence chrome (SettingsRolesPageView PageContextualHelpButton + Category-1 registry on /administration/users; Sources follow-up chrome removed (TB-2092) above tabs). SettingsRolesPageView syncs ?tab=keys via router.replace; AdminAuthority-gated keys panel. Sibling SSU = users; SER = roles; AUX = hub. Template SEK renamed to SEU to match owner. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-07) - path-tab surface hard-caps higher Evidence (below AUX access hub). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
