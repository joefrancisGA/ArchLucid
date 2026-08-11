import { ADVISORY_SCANS_SCANS_HREF } from "@/lib/advisory-scans-route";

/**
 * Traffic workbook row ID for Advisory scans Scans tab.
 * Owner backlog shorthand: ADT (owner GOA renamed to avoid collision with template alert-rules GOA).
 */
export const ADVISORY_SCANS_SCANS_TAB_TRAFFIC_ROW_ID = "ADT";

/** Canonical path tracked on the ADT workbook row. */
export const ADVISORY_SCANS_SCANS_TAB_TRAFFIC_PATH = ADVISORY_SCANS_SCANS_HREF;

/** Workbook Section column value Ã¢â‚¬â€ query-tab deep link on a governance hub. */
export const ADVISORY_SCANS_SCANS_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for ADT - documents Evidence chrome inherited from ADV hub on Scans tab.
 * ASCII-only for Windows console note scripts.
 */
export const ADVISORY_SCANS_SCANS_TAB_TRAFFIC_NOTE =
  "Advisory scans Scans tab (Tab surface) - inherits ADV hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/advisory-scans; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline above tabs). Default Scans tab content (recommendation generate). Sibling ADV = hub; AD = Schedules tab. Follow-up recommendations - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner GOA renamed to ADT to avoid collision with template alert-rules GOA. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
