import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";

/**
 * Traffic workbook row ID for the legacy Operate architecture-graph redirect shim.
 * Owner backlog shorthand: OPR.
 */
export const LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_ROW_ID = "OAX";

/** Canonical path tracked on the OAX workbook row. */
export const LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_PATH = LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH;

/**
 * Owner workbook Notes for OAX — documents that the shim redirects to {@link EVIDENCE_GRAPH_PATH} with query preserved.
 */
export const LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_NOTE =
 `Legacy Operate architecture-graph bookmark — App Router shim redirects to ${EVIDENCE_GRAPH_PATH} (query preserved, TB-1808). Canonical UX on GRA.`;
