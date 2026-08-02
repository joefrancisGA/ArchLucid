import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";

/**
 * Traffic workbook row ID for the legacy `/onboard` redirect shim.
 * Owner backlog shorthand: ON.
 */
export const LEGACY_ONBOARD_TRAFFIC_ROW_ID = "OXX";

/** Canonical path tracked on the OXX workbook row. */
export const LEGACY_ONBOARD_TRAFFIC_PATH = LEGACY_ONBOARD_PATH;

/**
 * Owner workbook Notes for OXX — documents that the shim permanently redirects to `/onboarding`.
 */
export const LEGACY_ONBOARD_TRAFFIC_NOTE =
  "Legacy onboarding bookmark — App Router shim permanently redirects to /onboarding (query preserved, TB-1796). Canonical UX on ARF (`/architecture/first-review-guide`).";
