/**
 * Traffic workbook row ID for create-home Clarifications archTab.
 * Owner backlog shorthand: REC.
 */
export const ARCHITECTURE_CLARIFICATIONS_TAB_TRAFFIC_ROW_ID = "REC";

/** Canonical path tracked on the REC workbook row. */
export const ARCHITECTURE_CLARIFICATIONS_TAB_TRAFFIC_PATH =
 "/architecture/reviews/[runId]?archTab=clarifications" as const;

/** Workbook Section column value â€” create-home tab surface. */
export const ARCHITECTURE_CLARIFICATIONS_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REC â€” create-home Clarifications archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_CLARIFICATIONS_TAB_TRAFFIC_NOTE =
 "Create-home-only archTab (TB-1836) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (committed packages use reviewTab only; no reviewTab twin for clarifications). above ArchitectureCreatedClarificationsPanel (missing items + open questions). Sibling REA = activity; REG = governance; RED = diagram; REE = evidence; REF = findings; REO = overview. Clarifications only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
