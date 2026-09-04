export const ARCHITECTURE_DIAGRAM_FINDING_PARAM = "diagramFindingId";

export function parseArchitectureDiagramFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function architectureDiagramFindingHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURE_DIAGRAM_FINDING_PARAM);
  } else {
    params.set(ARCHITECTURE_DIAGRAM_FINDING_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
