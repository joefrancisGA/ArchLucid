import { LEGACY_QUICK_START_PATH } from "@/lib/legacy-quick-start-route";

/**

 * Traffic workbook row ID for the legacy `/quick-start` redirect shim.

 * Owner backlog shorthand: QUI.

 */

export const LEGACY_QUICK_START_TRAFFIC_ROW_ID = "QUI";

/** Canonical path tracked on the QUI workbook row. */

export const LEGACY_QUICK_START_TRAFFIC_PATH = LEGACY_QUICK_START_PATH;

/**

 * Owner workbook Notes for QUI — documents redirect-only shim to `/get-started`.

 */

export const LEGACY_QUICK_START_TRAFFIC_NOTE =

  "Legacy marketing quick-start bookmark — App Router shim redirects to /get-started (query preserved; TB-1816). Permanent 301 in next.config.ts (TB-736). Canonical UX on GXX.";

