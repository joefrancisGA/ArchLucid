import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

/**
 * Traffic workbook row ID for Alert rules Advanced (composite) tab.
 * Owner backlog shorthand: GOC.
 */
export const ALERT_RULES_COMPOSITE_TAB_TRAFFIC_ROW_ID = "GOC";

/** Canonical path tracked on the GOC workbook row. */
export const ALERT_RULES_COMPOSITE_TAB_TRAFFIC_PATH = governanceAlertRulesTabHref("composite");

/** Workbook Section column value â€” query-tab deep link on alert-rules hub. */
export const ALERT_RULES_COMPOSITE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for GOC - documents Evidence chrome inherited from SAX hub on composite tab.
 * ASCII-only for Windows console note scripts.
 */
export const ALERT_RULES_COMPOSITE_TAB_TRAFFIC_NOTE =
 "Alert rules Advanced/composite tab (Tab surface) - inherits SAX hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/alert-rules; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline when not on Notifications). CompositeAlertRulesContentDeferred combines multiple signals. Sibling SAX = hub; ALE/GOR = routing; GLR = Conditions/rules; GOS = simulation. Alert configuration - not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 48/100 (2026-08-06) - composite-tab deep link hard-caps higher Evidence (same band as SAX hub / ADT schedules-style tabs). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
