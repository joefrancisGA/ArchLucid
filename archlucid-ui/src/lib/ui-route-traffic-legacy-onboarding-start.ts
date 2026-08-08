import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";

/**
 * Traffic workbook row ID for the legacy `/onboarding/start` redirect shim.
 * Owner backlog shorthand: ONS.
 */
export const LEGACY_ONBOARDING_START_TRAFFIC_ROW_ID = "OSX";

/** Canonical path tracked on the OSX workbook row. */
export const LEGACY_ONBOARDING_START_TRAFFIC_PATH = LEGACY_ONBOARDING_START_PATH;

/**
 * Owner workbook Notes for OSX — documents that the shim permanently redirects to `/onboarding`.
 */
export const LEGACY_ONBOARDING_START_TRAFFIC_NOTE =
 "Legacy onboarding start bookmark — App Router shim permanently redirects to /onboarding (query preserved, TB-1801). Canonical UX on ARF (`/architecture/first-review-guide`).";
