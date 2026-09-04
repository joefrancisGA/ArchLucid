export const PROVENANCE_EDGE_FOCUS_PARAM = "provEdgeId";
export const PROVENANCE_EDGES_EXPANDED_PARAM = "edgesExpanded";

export type ProvenanceEdgeFocusUrlState = {
  readonly edgeId: string | null;
  readonly edgesExpanded: boolean;
};

export function parseProvenanceEdgeFocusFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseProvenanceEdgesExpandedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function provenanceEdgeFocusHrefFromSearch(
  currentSearch: string,
  state: ProvenanceEdgeFocusUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const edgeId = (state.edgeId ?? "").trim();

  if (edgeId.length === 0) {
    params.delete(PROVENANCE_EDGE_FOCUS_PARAM);
  } else {
    params.set(PROVENANCE_EDGE_FOCUS_PARAM, edgeId);
  }

  if (!state.edgesExpanded) {
    params.delete(PROVENANCE_EDGES_EXPANDED_PARAM);
  } else {
    params.set(PROVENANCE_EDGES_EXPANDED_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
