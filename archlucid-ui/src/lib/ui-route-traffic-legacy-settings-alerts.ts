/**
 * Removed traffic workbook row ID for the retired `/settings/alerts` bookmark (TB-1886–TB-1890).
 * Do not reintroduce — Alert rules hub is scored only on SAX (`/governance/alert-rules`).
 */
export const REMOVED_SETTINGS_ALERTS_TRAFFIC_ROW_ID = "SEA";

/** Retired path — not a live App Router page or next.config redirect. */
export const RETIRED_SETTINGS_ALERTS_TRAFFIC_PATH = "/settings/alerts";

/** Canonical Alert rules hub scored on traffic row SAX. */
export const CANONICAL_ALERT_RULES_TRAFFIC_PATH = "/governance/alert-rules";
