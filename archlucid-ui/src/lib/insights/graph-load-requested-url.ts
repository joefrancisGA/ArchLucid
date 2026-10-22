import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GRAPH_LOAD_REQUESTED_PARAM = "load";

export function parseGraphLoadRequestedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function graphLoadRequestedHrefFromSearch(
  currentSearch: string,
  loadRequested: boolean,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (loadRequested) {
      params.set(GRAPH_LOAD_REQUESTED_PARAM, "1");
    } else {
      params.delete(GRAPH_LOAD_REQUESTED_PARAM);
    }
    },
  });
}
