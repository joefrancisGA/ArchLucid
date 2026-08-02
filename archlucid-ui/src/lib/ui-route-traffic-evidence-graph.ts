import {
  EVIDENCE_GRAPH_PATH,
  LEGACY_GRAPH_PATH,
} from "@/lib/evidence-graph-route";

/**
 * Traffic workbook row ID for the Evidence graph operator hub.
 * Owner backlog shorthand: INE.
 */
export const EVIDENCE_GRAPH_TRAFFIC_ROW_ID = "INE";

/** Canonical path tracked on the INE workbook row. */
export const EVIDENCE_GRAPH_TRAFFIC_PATH = EVIDENCE_GRAPH_PATH;

/** Workbook Section column value — operate analysis / evidence trail planning surface. */
export const EVIDENCE_GRAPH_TRAFFIC_SECTION = "Planning";

/**
 * Owner workbook Notes for INE — documents the live evidence graph hub.
 */
export const EVIDENCE_GRAPH_TRAFFIC_NOTE =
  "Canonical evidence trail operator hub — GraphPageContent with runId/graphNodeId query handoffs, trace table vs interactive graph tabs, provenance/decision/architecture graph modes, sample-mode banner, and OperatorSavedViewsBar. Left nav Evidence graph. Legacy /graph retired (no redirect). Deep links from findings, standards rules, golden journey. Former workbook row GRA.";

/** Retired graph bookmark path (no App Router redirect). */
export const LEGACY_GRAPH_TRAFFIC_PATH = LEGACY_GRAPH_PATH;
