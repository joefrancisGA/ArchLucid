import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export const GRAPH_NODE_TYPE_PARAM = "nodeType";

export function parseGraphNodeTypeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function graphNodeTypeHrefFromSearch(
  currentSearch: string,
  nodeType: string,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = nodeType.trim();

  if (trimmed.length === 0) {
    params.delete(GRAPH_NODE_TYPE_PARAM);
  } else {
    params.set(GRAPH_NODE_TYPE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
