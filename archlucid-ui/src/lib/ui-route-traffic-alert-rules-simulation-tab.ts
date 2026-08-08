import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

/**
 * Traffic workbook row ID for Alert rules Test alerts (simulation) tab.
 * Owner backlog shorthand: GOS.
 */
export const ALERT_RULES_SIMULATION_TAB_TRAFFIC_ROW_ID = "GOS";

/** Canonical path tracked on the GOS workbook row. */
export const ALERT_RULES_SIMULATION_TAB_TRAFFIC_PATH = governanceAlertRulesTabHref("simulation");

/** Workbook Section column value â€” query-tab deep link on alert-rules hub. */
export const ALERT_RULES_SIMULATION_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for GOS - documents Evidence chrome inherited from SAX hub on simulation tab.
 * ASCII-only for Windows console note scripts.
 */
export const ALERT_RULES_SIMULATION_TAB_TRAFFIC_NOTE =
 "Alert rules Test alerts/simulation tab (Tab surface) - inherits SAX hub Evidence chrome (PageContextualHelpButton + Category-1 registry on /governance/alert-rules; Sources follow-up chrome removed (TB-2092) Sources + claim-discipline when not on Notifications). AlertSimulationTuningSectionDeferred simulates and tunes alert behavior. Sibling SAX = hub; ALE/GOR = routing; GLR = Conditions/rules; GOC = composite. Alert configuration - not a signed-record Sources trail. Score 48/100 (2026-08-06) - simulation-tab deep link hard-caps higher Evidence (same band as SAX hub / GOC / GLR). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
