import type { DiagramEvidenceCitation } from "@/lib/findings/diagram-evidence-citation";

export const FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM = "diagramCitationPreview";

const PREVIEW_SEPARATOR = "|";

export function encodeDiagramCitationPreviewParam(citation: DiagramEvidenceCitation): string {
  return `${citation.evidenceItemId}${PREVIEW_SEPARATOR}${citation.shapeOrEdgeId}`;
}

export function parseDiagramCitationPreviewParam(raw: string | null | undefined): DiagramEvidenceCitation | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const separatorIndex = trimmed.indexOf(PREVIEW_SEPARATOR);

  if (separatorIndex < 0) {
    return null;
  }

  const evidenceItemId = trimmed.slice(0, separatorIndex).trim();
  const shapeOrEdgeId = trimmed.slice(separatorIndex + PREVIEW_SEPARATOR.length).trim();

  if (shapeOrEdgeId.length === 0) {
    return null;
  }

  return {
    evidenceItemId,
    shapeOrEdgeId,
  };
}

export function findingInspectDiagramCitationPreviewHrefFromSearch(
  currentSearch: string,
  citation: DiagramEvidenceCitation | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (citation === null) {
    params.delete(FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM);
  } else {
    params.set(FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM, encodeDiagramCitationPreviewParam(citation));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
