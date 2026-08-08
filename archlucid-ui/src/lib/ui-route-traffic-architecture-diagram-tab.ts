/**
 * Traffic workbook row ID for create-home Diagram archTab.
 * Owner backlog shorthand: RED.
 */
export const ARCHITECTURE_DIAGRAM_TAB_TRAFFIC_ROW_ID = "RED";

/** Canonical path tracked on the RED workbook row. */
export const ARCHITECTURE_DIAGRAM_TAB_TRAFFIC_PATH =
  "/architecture/reviews/[runId]?archTab=diagram" as const;

/** Workbook Section column value — create-home tab surface. */
export const ARCHITECTURE_DIAGRAM_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for RED — create-home Diagram archTab Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const ARCHITECTURE_DIAGRAM_TAB_TRAFFIC_NOTE =
  "Create-home Diagram archTab (Tab surface) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ArchitectureCreatedWorkspace syncs ?archTab=diagram. above ArchitectureDiagramPanel (Mermaid generate/edit; not authoritative). Sibling REA = activity; REC = clarifications; REG = governance; REE = evidence; REF = findings; REO = overview. Illustrative diagram only - not a signed-record Sources trail. Score 48/100 (2026-08-08) - create-home path-tab hard-caps higher Evidence (below RRE hub).";
