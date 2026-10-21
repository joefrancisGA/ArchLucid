import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GRAPH_NODE_ID_PARAM = "nodeId";
export const GRAPH_DECISION_ID_PARAM = "decisionId";

export function parseGraphNodeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseGraphDecisionIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function graphNodeIdHrefFromSearch(
  currentSearch: string,
  nodeId: string,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = nodeId.trim();

    if (trimmed.length === 0) {
      params.delete(GRAPH_NODE_ID_PARAM);
    } else {
      params.set(GRAPH_NODE_ID_PARAM, trimmed);
    }
    },
  });
}

export function graphDecisionIdHrefFromSearch(
  currentSearch: string,
  decisionId: string,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = decisionId.trim();

    if (trimmed.length === 0) {
      params.delete(GRAPH_DECISION_ID_PARAM);
    } else {
      params.set(GRAPH_DECISION_ID_PARAM, trimmed);
    }
    },
  });
}
