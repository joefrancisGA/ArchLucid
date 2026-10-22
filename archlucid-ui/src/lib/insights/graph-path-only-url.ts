import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GRAPH_PATH_ONLY_PARAM = "pathOnly";

export function parseGraphPathOnlyFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true" || trimmed === "yes";
}

export function graphPathOnlyHrefFromSearch(
  currentSearch: string,
  pathOnly: boolean,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!pathOnly) {
      params.delete(GRAPH_PATH_ONLY_PARAM);
    } else {
      params.set(GRAPH_PATH_ONLY_PARAM, "1");
    }
    },
  });
}
