/**
 * Traffic workbook row ID for create-home Findings archTab.
 * Owner backlog shorthand: REF.
 */
export const ARCHITECTURE_FINDINGS_TAB_TRAFFIC_ROW_ID = "REF";

/** Canonical path tracked on the REF workbook row. */
export const ARCHITECTURE_FINDINGS_TAB_TRAFFIC_PATH =
 "/architecture/reviews/[runId]?archTab=findings" as const;

/** Workbook Section column value Ã¢â‚¬â€ create-home tab surface. */
export const ARCHITECTURE_FINDINGS_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REF Ã¢â‚¬â€ create-home Findings archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_FINDINGS_TAB_TRAFFIC_NOTE =
 "Create-home Findings archTab (Tab surface) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ArchitectureCreatedWorkspace syncs ?archTab=findings. Twin committed surface is reviewTab=findings on ReviewDetailWorkspace (RRE hub chrome) with shared findings-first queue, collapsed assessment narrative, and buyer-safe citation labels. Sibling REA = activity; REC = clarifications; RED = diagram; REE = evidence; REG = governance; REO = overview. Assessment findings only - not a signed-record Sources trail. Score 62/100 (2026-08-09) - al-ui-rate P0 findings-tab IA parity with committed reviewTab surface.";
