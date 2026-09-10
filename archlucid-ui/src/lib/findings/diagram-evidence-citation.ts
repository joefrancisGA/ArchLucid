/** Parsed `diagram:{evidenceItemId}:{shapeOrEdgeId}` citation (AS-022 / AS-024). */
export type DiagramEvidenceCitation = {
  readonly evidenceItemId: string;
  readonly shapeOrEdgeId: string;
};

const DIAGRAM_CITATION_PREFIX = "diagram:";

export function tryParseDiagramEvidenceCitation(ref: string | null | undefined): DiagramEvidenceCitation | null {
  if (ref === null || ref === undefined) {
    return null;
  }

  const trimmed = ref.trim();

  if (!trimmed.toLowerCase().startsWith(DIAGRAM_CITATION_PREFIX)) {
    return null;
  }

  const remainder = trimmed.slice(DIAGRAM_CITATION_PREFIX.length);
  const separatorIndex = remainder.lastIndexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  const shapeOrEdgeId = remainder.slice(separatorIndex + 1).trim();

  if (shapeOrEdgeId.length === 0) {
    return null;
  }

  const evidenceItemId = remainder.slice(0, separatorIndex).trim();

  return {
    evidenceItemId,
    shapeOrEdgeId,
  };
}

export function diagramEvidenceCitationLabel(citation: DiagramEvidenceCitation): string {
  const shapeLabel = citation.shapeOrEdgeId.replace(/-/g, " ");

  return `Open diagram shape ${shapeLabel}`;
}
