import DOMPurify from "dompurify";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_DARK_NODE,
  ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE,
  ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
} from "@/lib/architecture/architecture-diagram-mermaid-config";

export type ArchitectureDiagramSvgPaletteOptions = {
  readonly dark?: boolean;
};
import {
  ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
  architectureDiagramLabelLineHeightPx,
  estimateArchitectureDiagramLabelWidthPx,
  wrapArchitectureDiagramLabelToWidth,
  wrapWidthInsideNodeRectPx,
} from "@/lib/architecture/wrap-architecture-diagram-label";

const SVG_NS = "http://www.w3.org/2000/svg";

function collapseLabelWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function readFiniteAttribute(element: Element, name: string, fallback: number): number {
  const parsed = Number.parseFloat(element.getAttribute(name) ?? "");

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function paintAttributeMissingOrNone(value: string | null): boolean {
  return value === null || value.length === 0 || value === "none";
}

function paintUnfilledSvgText(svg: Element): void {
  const texts = svg.querySelectorAll("text, tspan");

  for (const text of texts) {
    const fill = text.getAttribute("fill");

    if (paintAttributeMissingOrNone(fill)) {
      text.setAttribute("fill", "currentColor");
    }
  }
}

function resolveArchitectureDiagramNodePalette(dark: boolean): {
  fill: string;
  border: string;
  text: string;
  edge: string;
} {
  if (dark) {
    return ARCHITECTURE_DIAGRAM_MERMAID_DARK_NODE;
  }

  return ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE;
}

function isInsidePictogram(element: Element): boolean {
  return element.closest("g.pictogram") !== null;
}

function isForestCardBodyRect(rect: Element): boolean {
  if (rect.classList.contains("node-accent")) {
    return false;
  }

  if (rect.classList.contains("node-card")) {
    return true;
  }

  if (isInsidePictogram(rect)) {
    return false;
  }

  const parent = rect.parentElement;

  return parent !== null && parent.classList.contains("node");
}

/** Bakes node, edge, and label colors into the SVG so raster export does not depend on page CSS. */
function paintArchitectureDiagramNodePalette(svg: Element, dark: boolean): void {
  // Forest SVG has accent bars; client-dagre Mermaid fallback is neutral cards only (no accent bar).
  const palette = resolveArchitectureDiagramNodePalette(dark);
  const nodeGroups = svg.querySelectorAll("g.node");

  for (const nodeGroup of nodeGroups) {
    const cardRects = [...nodeGroup.children].filter(
      (child): child is Element =>
        child instanceof Element
        && child.tagName.toLowerCase() === "rect"
        && isForestCardBodyRect(child),
    );

    for (const shape of cardRects) {
      shape.setAttribute("fill", palette.fill);
      shape.setAttribute("stroke", palette.border);
      shape.setAttribute("stroke-width", "1.5");
      shape.removeAttribute("fill-opacity");
    }
  }

  const labels = svg.querySelectorAll("g.node text, g.node .nodeLabel");

  for (const label of labels) {
    if (label.closest("g.pictogram") !== null) {
      continue;
    }

    label.setAttribute("fill", palette.text);

    for (const tspan of label.querySelectorAll("tspan")) {
      tspan.setAttribute("fill", palette.text);
    }
  }

  const edgePaths = svg.querySelectorAll(
    "g.edgePaths path, g.edgePath path, path.flowchart-link, g.edge path.edge-path",
  );

  for (const path of edgePaths) {
    path.setAttribute("stroke", palette.edge);
    path.setAttribute("fill", "none");
  }
}

function closestNodeGroup(element: Element): Element | null {
  return element.closest("g.node");
}

function resolveLabelWrapWidthPx(foreignObject: Element): number {
  const nodeGroup = closestNodeGroup(foreignObject);

  if (nodeGroup !== null) {
    const rect = nodeGroup.querySelector("rect");

    if (rect !== null) {
      const rectWidth = readFiniteAttribute(rect, "width", 0);

      if (rectWidth > 0) {
        return wrapWidthInsideNodeRectPx(rectWidth);
      }
    }
  }

  const foreignObjectWidth = readFiniteAttribute(foreignObject, "width", 0);

  if (foreignObjectWidth > 0) {
    return wrapWidthInsideNodeRectPx(foreignObjectWidth);
  }

  return wrapWidthInsideNodeRectPx(ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH);
}

function readForeignObjectLabelLines(foreignObject: Element, wrapWidthPx: number): string[] {
  const clone = foreignObject.cloneNode(true);

  if (!(clone instanceof Element)) {
    return wrapArchitectureDiagramLabelToWidth(collapseLabelWhitespace(foreignObject.textContent ?? ""), wrapWidthPx);
  }

  const breaks = [...clone.querySelectorAll("br")];

  for (const breakElement of breaks) {
    breakElement.replaceWith(foreignObject.ownerDocument.createTextNode("\n"));
  }

  const rawLines = (clone.textContent ?? "")
    .split(/\n/)
    .map((line) => collapseLabelWhitespace(line))
    .filter((line) => line.length > 0);

  if (rawLines.length === 0) {
    return [];
  }

  const wrapped: string[] = [];

  for (const rawLine of rawLines) {
    wrapped.push(...wrapArchitectureDiagramLabelToWidth(rawLine, wrapWidthPx));
  }

  return wrapped;
}

function appendCenteredLabelTspans(
  text: Element,
  document: Document,
  lines: readonly string[],
  centerX: number,
  fontSizePx: number,
): void {
  const lineHeight = architectureDiagramLabelLineHeightPx(fontSizePx);
  const firstDy = -((lines.length - 1) * lineHeight) / 2;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line === undefined) {
      continue;
    }

    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(centerX));
    tspan.setAttribute("dy", index === 0 ? String(firstDy) : String(lineHeight));
    tspan.textContent = line;
    text.appendChild(tspan);
  }
}

function growNodeRectToFitLabelLines(nodeGroup: Element, lineCount: number, fontSizePx: number): void {
  const rect = nodeGroup.querySelector("rect");

  if (rect === null || lineCount <= 0) {
    return;
  }

  const paddingY = 12;
  const neededHeight = lineCount * architectureDiagramLabelLineHeightPx(fontSizePx) + paddingY;
  const currentHeight = readFiniteAttribute(rect, "height", 0);

  if (neededHeight <= currentHeight) {
    return;
  }

  const currentY = readFiniteAttribute(rect, "y", 0);
  const centerY = currentY + currentHeight / 2;
  rect.setAttribute("height", String(neededHeight));
  rect.setAttribute("y", String(centerY - neededHeight / 2));
}

function replaceForeignObjectWithSvgText(foreignObject: Element, document: Document): void {
  const parent = foreignObject.parentNode;
  const wrapWidth = resolveLabelWrapWidthPx(foreignObject);
  const lines = readForeignObjectLabelLines(foreignObject, wrapWidth);

  if (parent === null) {
    return;
  }

  if (lines.length === 0) {
    parent.removeChild(foreignObject);
    return;
  }

  const x = readFiniteAttribute(foreignObject, "x", 0);
  const y = readFiniteAttribute(foreignObject, "y", 0);
  const width = readFiniteAttribute(foreignObject, "width", 0);
  const height = readFiniteAttribute(foreignObject, "height", 0);
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const text = document.createElementNS(SVG_NS, "text");
  const fullLabel = lines.join(" ");
  const title = document.createElementNS(SVG_NS, "title");

  // Mermaid sizes the foreignObject around the wrapped HTML label; SVG text is
  // anchored at that box's center. tspans restore wrapping that DOMPurify would
  // otherwise flatten into one overflowing line.
  text.setAttribute("class", "nodeLabel");
  text.setAttribute("x", String(centerX));
  text.setAttribute("y", String(centerY));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-size", String(ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX));
  title.textContent = fullLabel;
  text.appendChild(title);
  appendCenteredLabelTspans(text, document, lines, centerX, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
  parent.replaceChild(text, foreignObject);

  const nodeGroup = closestNodeGroup(text);

  if (nodeGroup !== null) {
    growNodeRectToFitLabelLines(nodeGroup, lines.length, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
  }
}

function readSvgTextLabel(text: Element): string {
  const tspans = [...text.querySelectorAll("tspan")];

  if (tspans.length > 0) {
    return tspans
      .map((tspan) => collapseLabelWhitespace(tspan.textContent ?? ""))
      .filter((line) => line.length > 0)
      .join(" ");
  }

  const clone = text.cloneNode(true);

  if (!(clone instanceof Element)) {
    return collapseLabelWhitespace(text.textContent ?? "");
  }

  for (const title of clone.querySelectorAll("title")) {
    title.remove();
  }

  return collapseLabelWhitespace(clone.textContent ?? "");
}

function wrapExistingNodeSvgLabels(svg: Element, document: Document): void {
  const nodes = svg.querySelectorAll("g.node");

  for (const node of nodes) {
    const rect = node.querySelector("rect");
    const text = node.querySelector("text.nodeLabel, text");

    if (rect === null || text === null) {
      continue;
    }

    if (text.querySelectorAll("tspan").length > 1) {
      continue;
    }

    const rectWidth = readFiniteAttribute(rect, "width", 0);

    if (rectWidth <= 0) {
      continue;
    }

    const wrapWidth = wrapWidthInsideNodeRectPx(rectWidth);
    const label = readSvgTextLabel(text);

    if (label.length === 0) {
      continue;
    }

    if (estimateArchitectureDiagramLabelWidthPx(label) <= wrapWidth) {
      continue;
    }

    const lines = wrapArchitectureDiagramLabelToWidth(label, wrapWidth);

    if (lines.length <= 1) {
      continue;
    }

    const centerX = readFiniteAttribute(text, "x", 0);

    while (text.firstChild !== null) {
      text.removeChild(text.firstChild);
    }

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = label;
    text.appendChild(title);
    appendCenteredLabelTspans(text, document, lines, centerX, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
    growNodeRectToFitLabelLines(node, lines.length, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
  }
}

/**
 * Mermaid 11 still emits HTML labels inside foreignObject even when htmlLabels is false.
 * SVG-only DOMPurify then drops those nodes and leaves empty grey boxes.
 */
export function replaceMermaidForeignObjectLabelsWithSvgText(
  svgMarkup: string,
  options: ArchitectureDiagramSvgPaletteOptions = {},
): string {
  const dark = options.dark ?? false;
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return svgMarkup;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = parsed.documentElement;

  if (svg.localName.toLowerCase() !== "svg") {
    return svgMarkup;
  }

  if (parsed.querySelector("parsererror") !== null) {
    return svgMarkup;
  }

  const foreignObjects = [...svg.querySelectorAll("foreignObject")];

  for (const foreignObject of foreignObjects) {
    replaceForeignObjectWithSvgText(foreignObject, parsed);
  }

  wrapExistingNodeSvgLabels(svg, parsed);
  paintUnfilledSvgText(svg);
  paintArchitectureDiagramNodePalette(svg, dark);
  svg.setAttribute("overflow", "visible");

  return new XMLSerializer().serializeToString(svg);
}

/** Keeps node names visible while still stripping script and leftover foreignObject. */
export function sanitizeArchitectureDiagramSvg(
  svgMarkup: string,
  options: ArchitectureDiagramSvgPaletteOptions = {},
): string {
  const withVisibleLabels = replaceMermaidForeignObjectLabelsWithSvgText(svgMarkup, options);

  return DOMPurify.sanitize(withVisibleLabels, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
  });
}
