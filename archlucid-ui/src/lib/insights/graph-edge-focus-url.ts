import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export const GRAPH_EDGE_FOCUS_PARAM = "graphEdgeId";

export function parseGraphEdgeFocusFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function graphEdgeFocusHrefFromSearch(
  currentSearch: string,
  graphEdgeId: string | null,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (graphEdgeId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GRAPH_EDGE_FOCUS_PARAM);
  } else {
    params.set(GRAPH_EDGE_FOCUS_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
