/**
 * Traffic workbook row ID for Alerts inbox legacy tab deep link.
 * Owner backlog shorthand: GOI.
 */
export const ALERTS_INBOX_TAB_TRAFFIC_ROW_ID = "GOI";

/** Canonical path tracked on the GOI workbook row (legacy query; redirects to AL). */
export const ALERTS_INBOX_TAB_TRAFFIC_PATH = "/governance/alerts?tab=inbox";

/** Workbook Section column value — legacy query-tab deep link on alerts hub. */
export const ALERTS_INBOX_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for GOI - documents redirect to AL hub (no separate inbox-tab chrome).
 * ASCII-only for Windows console note scripts.
 */
export const ALERTS_INBOX_TAB_TRAFFIC_NOTE =
  "Alerts inbox legacy tab deep link (Tab surface) - `?tab=inbox` canonicalizes to /governance/alerts (AL) via shouldCanonicalizeAlertsInboxTabParam (TB-1594); no dedicated inbox-tab UI. Destination AL hub chrome: AlertsHubChrome with PageContextualHelpButton (topic map alerts) + OperatorPageHeader / AlertsGovernanceContextPanel. Sibling AL = canonical inbox; SAX = alert rules; HA = alerts help. Not a signed-record Sources trail. Does not imply CPA SOC 2 or third-party pen-test publication. Score 28/100 (2026-08-06) - legacy tab redirect hard-caps higher Evidence (same band as other redirect/shim surfaces).";
