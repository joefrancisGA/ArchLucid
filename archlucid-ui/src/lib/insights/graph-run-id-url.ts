import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GRAPH_RUN_ID_PARAM = "runId";

export function parseGraphRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function graphRunIdHrefFromSearch(
  currentSearch: string,
  runId: string,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = runId.trim();

    if (trimmed.length === 0) {
      params.delete(GRAPH_RUN_ID_PARAM);
    } else {
      params.set(GRAPH_RUN_ID_PARAM, trimmed);
    }
    },
  });
}
