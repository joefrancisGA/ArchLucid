export const PROVENANCE_SELECTED_NODE_PARAM = "provNodeId";

export function parseProvenanceSelectedNodeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function provenanceSelectedNodeHrefFromSearch(
  currentSearch: string,
  nodeId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (nodeId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(PROVENANCE_SELECTED_NODE_PARAM);
  } else {
    params.set(PROVENANCE_SELECTED_NODE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
