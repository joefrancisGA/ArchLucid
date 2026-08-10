/**
 * Traffic workbook row ID for create-home Overview archTab.
 * Owner backlog shorthand: REO.
 */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_ROW_ID = "REO";

/** Canonical path tracked on the REO workbook row. */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_PATH =
 "/architecture/reviews/[runId]?archTab=overview" as const;

/** Workbook Section column value â€” create-home tab surface. */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REO â€” create-home Overview archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_NOTE =
 "Create-home-only archTab (TB-1861) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=overview on RRE hub chrome). above ArchitectureCreatedOverviewPanel (structured brief + missing items). Sibling REA = activity; REC = clarifications; RED = diagram; REE = evidence; REF = findings; REG = governance. Submitted brief only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
