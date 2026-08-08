/**
 * Traffic workbook row ID for create-home Overview archTab.
 * Owner backlog shorthand: REO.
 */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_ROW_ID = "REO";

/** Canonical path tracked on the REO workbook row. */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_PATH =
  "/architecture/reviews/[runId]?archTab=overview" as const;

/** Workbook Section column value — create-home tab surface. */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REO — create-home Overview archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_OVERVIEW_TAB_TRAFFIC_NOTE =
  "Create-home Overview archTab (Tab surface) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ArchitectureCreatedWorkspace syncs ?archTab=overview. above ArchitectureCreatedOverviewPanel (structured brief + missing items). Twin committed surface is reviewTab=overview on ReviewDetailWorkspace (RRE hub chrome). Sibling REA = activity; REC = clarifications; RED = diagram; REE = evidence; REF = findings; REG = governance. Submitted brief only - not a signed-record Sources trail. Score 48/100 (2026-08-08) - create-home path-tab hard-caps higher Evidence (below RRE hub).";
