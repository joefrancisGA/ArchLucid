import { GRAPH_NODE_FOCUS_QUERY_PARAM } from "@/lib/graph-finding-deep-links";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export const GRAPH_NODE_FOCUS_PARAM = GRAPH_NODE_FOCUS_QUERY_PARAM;

export function parseGraphNodeFocusFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function graphNodeFocusHrefFromSearch(
  currentSearch: string,
  graphNodeId: string | null,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (graphNodeId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GRAPH_NODE_FOCUS_PARAM);
  } else {
    params.set(GRAPH_NODE_FOCUS_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
