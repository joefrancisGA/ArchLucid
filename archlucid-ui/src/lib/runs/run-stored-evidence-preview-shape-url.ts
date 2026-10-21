import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (shapeOrEdgeId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM);
    } else {
      params.set(RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM, trimmed);
    }
    },
  });
}
