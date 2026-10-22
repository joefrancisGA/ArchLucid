import { isMermaidDiagramSource } from "@/lib/help/help-mermaid";

export type StoredEvidenceDiagramPreviewFormat = "mermaid" | "svg" | "drawio" | "vsdx" | "plain";

export function resolveStoredEvidenceDiagramPreviewFormat(
  contentType: string,
  fileName: string,
  source?: string | null,
): StoredEvidenceDiagramPreviewFormat {
  const normalizedType = contentType.trim().toLowerCase();
  const lowerName = fileName.trim().toLowerCase();

  if (
    normalizedType === "text/vnd.mermaid"
    || lowerName.endsWith(".mmd")
    || lowerName.endsWith(".mermaid")
    || (source !== null && source !== undefined && isMermaidDiagramSource(source))
  ) {
    return "mermaid";
  }

  if (
    normalizedType === "application/vnd.archlucid.diagram+svg"
    || normalizedType === "image/svg+xml"
    || lowerName.endsWith(".svg")
  ) {
    return "svg";
  }

  if (normalizedType === "application/vnd.jgraph.mxfile" || lowerName.endsWith(".drawio")) {
    return "drawio";
  }

  if (
    normalizedType === "application/vnd.ms-visio.drawing.main+xml"
    || lowerName.endsWith(".vsdx")
    || lowerName.endsWith(".vsd")
  ) {
    return "vsdx";
  }

  return "plain";
}

export function storedEvidenceDiagramShapeHighlightHonestyMessage(
  shapeOrEdgeId: string,
  format: StoredEvidenceDiagramPreviewFormat,
): string | null {
  if (format === "mermaid") {
    return null;
  }

  const trimmedShapeId = shapeOrEdgeId.trim();

  if (trimmedShapeId.length === 0) {
    return null;
  }

  return `Open file; shape id ${trimmedShapeId}.`;
}
