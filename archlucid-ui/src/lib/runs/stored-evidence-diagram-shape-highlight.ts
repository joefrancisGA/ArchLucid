export const STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS = "stored-evidence-diagram-shape-highlight";

const HIGHLIGHT_STYLE = `
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} * {
  stroke: rgb(37, 99, 235) !important;
  stroke-width: 3px !important;
}
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} rect,
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} circle,
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} polygon,
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} path,
.${STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS} ellipse {
  filter: drop-shadow(0 0 4px rgba(37, 99, 235, 0.55));
}
`;

let highlightStyleInjected = false;

function ensureHighlightStyle(): void {
  if (highlightStyleInjected || typeof document === "undefined") {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-testid", "stored-evidence-diagram-shape-highlight-style");
  style.textContent = HIGHLIGHT_STYLE;
  document.head.appendChild(style);
  highlightStyleInjected = true;
}

function normalizeShapeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function nodeMatchesShapeId(node: Element, shapeId: string): boolean {
  const normalizedShapeId = normalizeShapeToken(shapeId);

  if (normalizedShapeId.length === 0) {
    return false;
  }

  const id = node.getAttribute("id") ?? "";
  const normalizedId = normalizeShapeToken(id);

  if (normalizedId.includes(normalizedShapeId)) {
    return true;
  }

  const title = node.querySelector("title")?.textContent?.trim() ?? "";

  return normalizeShapeToken(title).includes(normalizedShapeId);
}

/** Applies a visible outline to SVG diagram nodes that match the cited shape id (AS-025). */
export function applyStoredEvidenceDiagramShapeHighlight(
  svg: SVGSVGElement,
  shapeOrEdgeId: string,
): boolean {
  ensureHighlightStyle();

  const matches = Array.from(svg.querySelectorAll("g.node, g.edgeLabel, g.cluster, [id]")).filter((node) =>
    nodeMatchesShapeId(node, shapeOrEdgeId),
  );

  for (const node of matches) {
    node.classList.add(STORED_EVIDENCE_DIAGRAM_SHAPE_HIGHLIGHT_CLASS);
  }

  return matches.length > 0;
}

/** @deprecated Use applyStoredEvidenceDiagramShapeHighlight. */
export const applyStoredEvidenceMermaidShapeHighlight = applyStoredEvidenceDiagramShapeHighlight;
