import DOMPurify from "dompurify";

import { ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH } from "@/lib/architecture/architecture-diagram-mermaid-config";
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

function paintUnfilledMermaidShapes(svg: Element): void {
  const nodeShapes = svg.querySelectorAll("g.node rect, g.node polygon, g.node circle, g.cluster rect");

  for (const shape of nodeShapes) {
    if (paintAttributeMissingOrNone(shape.getAttribute("stroke"))) {
      shape.setAttribute("stroke", "currentColor");

      if (paintAttributeMissingOrNone(shape.getAttribute("stroke-width"))) {
        shape.setAttribute("stroke-width", "1.5");
      }
    }

    if (shape.getAttribute("fill") === "none") {
      shape.setAttribute("fill", "currentColor");
      shape.setAttribute("fill-opacity", "0.12");
    }
  }

  const edgePaths = svg.querySelectorAll("g.edgePaths path, g.edgePath path, path.flowchart-link");

  for (const path of edgePaths) {
    if (paintAttributeMissingOrNone(path.getAttribute("stroke"))) {
      path.setAttribute("stroke", "currentColor");
    }

    if (paintAttributeMissingOrNone(path.getAttribute("fill"))) {
      path.setAttribute("fill", "none");
    }
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
export function replaceMermaidForeignObjectLabelsWithSvgText(svgMarkup: string): string {
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
  paintUnfilledMermaidShapes(svg);
  svg.setAttribute("overflow", "visible");

  return new XMLSerializer().serializeToString(svg);
}

/** Keeps node names visible while still stripping script and leftover foreignObject. */
export function sanitizeArchitectureDiagramSvg(svgMarkup: string): string {
  const withVisibleLabels = replaceMermaidForeignObjectLabelsWithSvgText(svgMarkup);

  return DOMPurify.sanitize(withVisibleLabels, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
  });
}
