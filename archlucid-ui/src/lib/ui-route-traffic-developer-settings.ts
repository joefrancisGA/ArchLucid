import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";

/**
 * Traffic workbook row ID for Internal developer tools.
 * Owner backlog shorthand was SED; template/catalog ID is SDX.
 */
export const DEVELOPER_SETTINGS_TRAFFIC_ROW_ID = "SDX";

/** Legacy owner workbook shorthand (TB-1896); maps to {@link DEVELOPER_SETTINGS_TRAFFIC_ROW_ID}. */
export const DEVELOPER_SETTINGS_TRAFFIC_LEGACY_ROW_ID = "SED";

/** Canonical path tracked on the SDX workbook row. */
export const DEVELOPER_SETTINGS_TRAFFIC_PATH = "/administration/developer";

/** Customer shells redirect here when the internal gate is off (server-enforced). */
export const DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH = ACCOUNT_PREFERENCES_PATH;

/**
 * Workbook Section column — internal diagnostic, not buyer Settings hub traffic.
 */
export const DEVELOPER_SETTINGS_TRAFFIC_SECTION = "Admin";

/** Monthly share for buyer shells (always zero — page is internal-gated). */
export const DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE = "0";

/**
 * Owner workbook Notes for SDX/SED - documents gated internal-only developer tools.
 * ASCII-only for Windows console note scripts.
 */
export const DEVELOPER_SETTINGS_TRAFFIC_NOTE =
  "No";
