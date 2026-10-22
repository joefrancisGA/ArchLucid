/**
 * Removed traffic workbook row ID for legacy `/governance/alerts?tab=inbox` (TB-1594).
 * Do not reintroduce — inbox is scored only on AL (`/governance/alerts`).
 */
export const REMOVED_ALERTS_INBOX_TAB_TRAFFIC_ROW_ID = "GOI";

/** Retired query deep-link — no dedicated inbox-tab UI; product emits bare `/governance/alerts`. */
export const RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH = "/governance/alerts?tab=inbox";

/** Canonical alerts inbox scored on traffic row AL. */
export const CANONICAL_ALERTS_INBOX_TRAFFIC_PATH = "/governance/alerts";
