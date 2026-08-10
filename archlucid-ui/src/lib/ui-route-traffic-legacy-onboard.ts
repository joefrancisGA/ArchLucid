import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";

/**
 * Traffic workbook row ID for the legacy `/onboard` redirect shim.
 * Owner backlog shorthand: ON.
 */
export const LEGACY_ONBOARD_TRAFFIC_ROW_ID = "OXX";

/** Canonical path tracked on the OXX workbook row. */
export const LEGACY_ONBOARD_TRAFFIC_PATH = LEGACY_ONBOARD_PATH;

/**
 * Owner workbook Notes for OXX — documents redirect-only shim to the canonical First review guide.
 */
export const LEGACY_ONBOARD_TRAFFIC_NOTE =
 "Legacy onboarding bookmark — App Router shim permanently redirects to /architecture/first-review-guide (query preserved, TB-1796). Canonical UX on ARF.";
