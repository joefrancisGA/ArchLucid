import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";

/**
 * Traffic workbook row ID for the legacy `/onboarding/start` redirect shim.
 * Owner backlog shorthand: ONS.
 */
export const LEGACY_ONBOARDING_START_TRAFFIC_ROW_ID = "OSX";

/** Canonical path tracked on the OSX workbook row. */
export const LEGACY_ONBOARDING_START_TRAFFIC_PATH = LEGACY_ONBOARDING_START_PATH;

/**
 * Owner workbook Notes for OSX — documents redirect-only shim to the canonical First review guide.
 */
export const LEGACY_ONBOARDING_START_TRAFFIC_NOTE =
 "Legacy onboarding start bookmark — App Router shim permanently redirects to /architecture/first-review-guide (query preserved, TB-1801). Canonical UX on ARF.";
