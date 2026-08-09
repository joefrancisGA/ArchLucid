/**
 * Traffic workbook row ID for create-home Evidence archTab.
 * Owner backlog shorthand: REE.
 */
export const ARCHITECTURE_EVIDENCE_TAB_TRAFFIC_ROW_ID = "REE";

/** Canonical path tracked on the REE workbook row. */
export const ARCHITECTURE_EVIDENCE_TAB_TRAFFIC_PATH =
 "/architecture/reviews/[runId]?archTab=evidence" as const;

/** Workbook Section column value â€” create-home tab surface. */
export const ARCHITECTURE_EVIDENCE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REE â€” create-home Evidence archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_EVIDENCE_TAB_TRAFFIC_NOTE =
 "Create-home Evidence archTab (Tab surface) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ArchitectureCreatedWorkspace syncs ?archTab=evidence. above RunDetailCaptureEvidenceSection / BulkEvidenceUpload (TB-1846 sibling band). Twin committed surface is reviewTab=evidence on ReviewDetailWorkspace (RRE hub chrome). Sibling REA = activity; REC = clarifications; RED = diagram; REF = findings; REG = governance; REO = overview. Capture upload only - not a signed-record Sources trail.tab-surface ceiling below parent hub Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
