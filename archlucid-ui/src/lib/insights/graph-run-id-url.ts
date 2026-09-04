import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    params.delete(GRAPH_RUN_ID_PARAM);
  } else {
    params.set(GRAPH_RUN_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
