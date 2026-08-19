import {
 EVIDENCE_GRAPH_PATH,
 LEGACY_GRAPH_PATH,
} from "@/lib/evidence-graph-route";

/**
 * Traffic workbook row ID for the Evidence graph operator hub.
 * Owner backlog shorthand: GRA.
 */
export const EVIDENCE_GRAPH_TRAFFIC_ROW_ID = "GRA";

/** Canonical path tracked on the GRA workbook row. */
export const EVIDENCE_GRAPH_TRAFFIC_PATH = EVIDENCE_GRAPH_PATH;

/** Workbook Section column value — operate analysis / evidence trail planning surface. */
export const EVIDENCE_GRAPH_TRAFFIC_SECTION = "Planning";

/**
 * Owner workbook Notes for GRA — documents the live evidence graph hub.
 */
export const EVIDENCE_GRAPH_TRAFFIC_NOTE =
  "Canonical evidence trail operator hub — GraphPageContent with runId/graphNodeId query handoffs, trace table vs interactive graph tabs, provenance/decision/architecture graph modes, sample-mode banner, and OperatorSavedViewsBar. Left nav Evidence graph. Legacy /graph retired (no redirect). Deep links from findings, standards rules, golden journey.";

/** Retired graph bookmark path (no App Router redirect). */
export const LEGACY_GRAPH_TRAFFIC_PATH = LEGACY_GRAPH_PATH;
