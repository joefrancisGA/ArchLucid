export const RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM = "shape";

export function parseRunStoredEvidencePreviewShapeFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function runStoredEvidencePreviewShapeHrefFromSearch(
  currentSearch: string,
  shapeOrEdgeId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (shapeOrEdgeId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM);
  } else {
    params.set(RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
