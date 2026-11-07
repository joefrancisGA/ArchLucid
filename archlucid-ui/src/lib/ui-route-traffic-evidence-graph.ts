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
  "No";

/** Retired graph bookmark path (no App Router redirect). */
export const LEGACY_GRAPH_TRAFFIC_PATH = LEGACY_GRAPH_PATH;
