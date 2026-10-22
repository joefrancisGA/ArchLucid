import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = nodeType.trim();

    if (trimmed.length === 0) {
      params.delete(GRAPH_NODE_TYPE_PARAM);
    } else {
      params.set(GRAPH_NODE_TYPE_PARAM, trimmed);
    }
    },
  });
}
