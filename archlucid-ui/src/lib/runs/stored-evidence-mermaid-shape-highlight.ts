const HIGHLIGHT_CLASS = "stored-evidence-mermaid-shape-highlight";

const HIGHLIGHT_STYLE = `
.${HIGHLIGHT_CLASS} * {
  stroke: rgb(37, 99, 235) !important;
  stroke-width: 3px !important;
}
.${HIGHLIGHT_CLASS} rect,
.${HIGHLIGHT_CLASS} circle,
.${HIGHLIGHT_CLASS} polygon,
.${HIGHLIGHT_CLASS} path,
.${HIGHLIGHT_CLASS} ellipse {
  filter: drop-shadow(0 0 4px rgba(37, 99, 235, 0.55));
}
`;

let highlightStyleInjected = false;

function ensureHighlightStyle(): void {
  if (highlightStyleInjected || typeof document === "undefined") {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-testid", "stored-evidence-mermaid-shape-highlight-style");
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

/** Applies a visible outline to mermaid SVG nodes that match the cited diagram shape id. */
export function applyStoredEvidenceMermaidShapeHighlight(
  svg: SVGSVGElement,
  shapeOrEdgeId: string,
): boolean {
  ensureHighlightStyle();

  const matches = Array.from(svg.querySelectorAll("g.node, g.edgeLabel, g.cluster")).filter((node) =>
    nodeMatchesShapeId(node, shapeOrEdgeId),
  );

  for (const node of matches) {
    node.classList.add(HIGHLIGHT_CLASS);
  }

  return matches.length > 0;
}
