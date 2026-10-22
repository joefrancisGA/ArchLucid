import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (graphEdgeId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(GRAPH_EDGE_FOCUS_PARAM);
    } else {
      params.set(GRAPH_EDGE_FOCUS_PARAM, trimmed);
    }
    },
  });
}
