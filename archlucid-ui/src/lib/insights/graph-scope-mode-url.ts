import {
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export const GRAPH_SCOPE_MODE_PARAM = "graphMode";

const GRAPH_MODE_IDS = new Set<string>([
  "provenance-full",
  "decision-subgraph",
  "node-neighborhood",
  "architecture",
]);

export const DEFAULT_GRAPH_SCOPE_MODE: GraphMode = "provenance-full";

export function parseGraphScopeModeFromSearch(raw: string | null | undefined): GraphMode {
  if (raw === null || raw === undefined) {
    return DEFAULT_GRAPH_SCOPE_MODE;
  }

  const trimmed = raw.trim();

  if (!GRAPH_MODE_IDS.has(trimmed)) {
    return DEFAULT_GRAPH_SCOPE_MODE;
  }

  return trimmed as GraphMode;
}

export function graphScopeModeHrefFromSearch(
  currentSearch: string,
  mode: GraphMode,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (mode === DEFAULT_GRAPH_SCOPE_MODE) {
    params.delete(GRAPH_SCOPE_MODE_PARAM);
  } else {
    params.set(GRAPH_SCOPE_MODE_PARAM, mode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
