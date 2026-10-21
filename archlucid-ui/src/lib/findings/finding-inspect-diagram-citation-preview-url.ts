import type { DiagramEvidenceCitation } from "@/lib/findings/diagram-evidence-citation";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (citation === null) {
      params.delete(FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM);
    } else {
      params.set(FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM, encodeDiagramCitationPreviewParam(citation));
    }
    },
  });
}
