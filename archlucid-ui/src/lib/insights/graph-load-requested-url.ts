import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

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
  const params = new URLSearchParams(currentSearch);

  if (loadRequested) {
    params.set(GRAPH_LOAD_REQUESTED_PARAM, "1");
  } else {
    params.delete(GRAPH_LOAD_REQUESTED_PARAM);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
