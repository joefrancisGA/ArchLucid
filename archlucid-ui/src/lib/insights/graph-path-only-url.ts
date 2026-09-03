import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

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
  const params = new URLSearchParams(currentSearch);

  if (!pathOnly) {
    params.delete(GRAPH_PATH_ONLY_PARAM);
  } else {
    params.set(GRAPH_PATH_ONLY_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
