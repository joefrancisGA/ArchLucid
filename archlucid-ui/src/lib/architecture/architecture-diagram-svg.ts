import DOMPurify from "dompurify";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_DARK_NODE,
  ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE,
  ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
} from "@/lib/architecture/architecture-diagram-mermaid-config";
import { fitInventoryDiagramClusterFrames } from "@/lib/architecture/fit-inventory-diagram-cluster-frames";
import {
  ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
  architectureDiagramLabelLineHeightPx,
  estimateArchitectureDiagramLabelWidthPx,
  wrapArchitectureDiagramLabelToWidth,
  wrapWidthInsideNodeRectPx,
} from "@/lib/architecture/wrap-architecture-diagram-label";

export type ArchitectureDiagramSvgPaletteOptions = {
  readonly dark?: boolean;
};

const SVG_NS = "http://www.w3.org/2000/svg";

const CLUSTER_LABEL_INSET_PX = 4;
const CLUSTER_TITLE_BAND_EXTRA_INSET_PX = 4;
const CLUSTER_LABEL_OVERLAP_TOLERANCE_PX = 1;

type ForeignObjectLabelKind = "node" | "cluster" | "edge";

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

function closestClusterGroup(element: Element): Element | null {
  const cluster = element.closest("g.cluster");

  if (cluster === null) {
    return null;
  }

  if (element.closest("g.node") !== null) {
    return null;
  }

  return cluster;
}

function resolveForeignObjectLabelKind(foreignObject: Element): ForeignObjectLabelKind {
  if (closestNodeGroup(foreignObject) !== null) {
    return "node";
  }

  if (closestClusterGroup(foreignObject) !== null) {
    return "cluster";
  }

  if (foreignObject.closest("g.edgeLabel, g.edge") !== null) {
    return "edge";
  }

  return "node";
}

function readClusterLabelText(cluster: Element): string {
  const existing = cluster.querySelector("text.cluster-label");

  if (existing === null) {
    return "";
  }

  return collapseLabelWhitespace(existing.textContent ?? "");
}

function clusterAlreadyHasMatchingLabel(cluster: Element, label: string): boolean {
  const existingLabel = readClusterLabelText(cluster);

  if (existingLabel.length === 0) {
    return false;
  }

  return existingLabel === collapseLabelWhitespace(label);
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

function appendTopStartLabelTspans(
  text: Element,
  document: Document,
  lines: readonly string[],
  startX: number,
  startY: number,
  fontSizePx: number,
): void {
  const lineHeight = architectureDiagramLabelLineHeightPx(fontSizePx);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line === undefined) {
      continue;
    }

    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(startX));
    tspan.setAttribute("dy", index === 0 ? "0" : String(lineHeight));
    tspan.textContent = line;

    if (index === 0) {
      text.setAttribute("x", String(startX));
      text.setAttribute("y", String(startY));
    }

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

  const fullLabel = lines.join(" ");
  const labelKind = resolveForeignObjectLabelKind(foreignObject);
  const clusterGroup = labelKind === "cluster" ? closestClusterGroup(foreignObject) : null;

  if (clusterGroup !== null && clusterAlreadyHasMatchingLabel(clusterGroup, fullLabel)) {
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
  const title = document.createElementNS(SVG_NS, "title");

  title.textContent = fullLabel;
  text.appendChild(title);
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-size", String(ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX));

  switch (labelKind) {
    case "cluster": {
      const startX = x + CLUSTER_LABEL_INSET_PX;
      const startY = y + CLUSTER_LABEL_INSET_PX;
      text.setAttribute("class", "cluster-label");
      text.setAttribute("text-anchor", "start");
      text.setAttribute("dominant-baseline", "hanging");
      appendTopStartLabelTspans(text, document, lines, startX, startY, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
      break;
    }
    case "edge": {
      text.setAttribute("class", "edgeLabel");
      text.setAttribute("x", String(centerX));
      text.setAttribute("y", String(centerY));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      appendCenteredLabelTspans(text, document, lines, centerX, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
      break;
    }
    case "node": {
      // Mermaid sizes the foreignObject around the wrapped HTML label; SVG text is
      // anchored at that box's center. tspans restore wrapping that DOMPurify would
      // otherwise flatten into one overflowing line.
      text.setAttribute("class", "nodeLabel");
      text.setAttribute("x", String(centerX));
      text.setAttribute("y", String(centerY));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      appendCenteredLabelTspans(text, document, lines, centerX, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
      break;
    }
    default: {
      const exhaustive: never = labelKind;
      throw new Error(`Unhandled foreignObject label kind: ${String(exhaustive)}`);
    }
  }

  parent.replaceChild(text, foreignObject);

  if (labelKind === "node") {
    const nodeGroup = closestNodeGroup(text);

    if (nodeGroup !== null) {
      growNodeRectToFitLabelLines(nodeGroup, lines.length, ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
    }
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

function shouldSkipNodeLabelWrap(node: Element, text: Element): boolean {
  if (text.classList.contains("cluster-label")) {
    return true;
  }

  if (node.querySelector("g.pictogram") !== null) {
    return true;
  }

  const textElements = node.querySelectorAll("text");

  if (textElements.length >= 2) {
    return true;
  }

  return false;
}

function wrapExistingNodeSvgLabels(svg: Element, document: Document): void {
  const nodes = svg.querySelectorAll("g.node");

  for (const node of nodes) {
    const rect = node.querySelector("rect");
    const text = node.querySelector("text.nodeLabel");

    if (rect === null || text === null) {
      continue;
    }

    if (shouldSkipNodeLabelWrap(node, text)) {
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

function readClusterChromeRect(cluster: Element): Element | null {
  return cluster.querySelector("rect, polygon");
}

function readFirstNodeRectInCluster(cluster: Element): Element | null {
  const nodes = cluster.querySelectorAll("g.node");

  for (const node of nodes) {
    const rect = node.querySelector("rect");

    if (rect !== null) {
      return rect;
    }
  }

  return null;
}

function estimateClusterLabelBottomY(label: Element): number {
  const labelY = readFiniteAttribute(label, "y", 0);
  const fontSize = readFiniteAttribute(label, "font-size", ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX);
  const lineCount = Math.max(1, label.querySelectorAll("tspan").length);
  const lineHeight = architectureDiagramLabelLineHeightPx(fontSize);

  return labelY + lineCount * lineHeight;
}

function labelsOverlapOnYAxis(labelBottomY: number, nodeTopY: number): boolean {
  return labelBottomY > nodeTopY + CLUSTER_LABEL_OVERLAP_TOLERANCE_PX;
}

function expandViewBoxUpward(svg: Element, extraHeight: number): void {
  const viewBox = svg.getAttribute("viewBox");

  if (viewBox === null || extraHeight <= 0) {
    return;
  }

  const parts = viewBox.split(/\s+/u).map((part) => Number.parseFloat(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return;
  }

  const minX = parts[0] ?? 0;
  const minY = parts[1] ?? 0;
  const width = parts[2] ?? 0;
  const height = parts[3] ?? 0;
  const newMinY = minY - extraHeight;

  svg.setAttribute("viewBox", `${minX} ${newMinY} ${width} ${height + extraHeight}`);
}

function reserveClusterTitleBands(svg: Element): void {
  const clusters = svg.querySelectorAll("g.cluster");
  const titleBandHeight =
    architectureDiagramLabelLineHeightPx(ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX)
    + CLUSTER_TITLE_BAND_EXTRA_INSET_PX;

  for (const cluster of clusters) {
    const label = cluster.querySelector("text.cluster-label");

    if (label === null) {
      continue;
    }

    const labelText = collapseLabelWhitespace(label.textContent ?? "");

    if (labelText.length === 0) {
      continue;
    }

    const clusterChrome = readClusterChromeRect(cluster);
    const firstNodeRect = readFirstNodeRectInCluster(cluster);

    if (clusterChrome === null || firstNodeRect === null) {
      continue;
    }

    const labelBottomY = estimateClusterLabelBottomY(label);
    const nodeTopY = readFiniteAttribute(firstNodeRect, "y", 0);

    if (!labelsOverlapOnYAxis(labelBottomY, nodeTopY)) {
      continue;
    }

    const targetLabelY = nodeTopY - titleBandHeight;
    const currentLabelY = readFiniteAttribute(label, "y", 0);
    const labelShift = currentLabelY - targetLabelY;

    if (labelShift > 0) {
      label.setAttribute("y", String(targetLabelY));

      for (const tspan of label.querySelectorAll("tspan")) {
        const tspanY = readFiniteAttribute(tspan, "y", currentLabelY);
        tspan.setAttribute("y", String(tspanY - labelShift));
      }
    }

    const clusterY = readFiniteAttribute(clusterChrome, "y", 0);
    const clusterHeight = readFiniteAttribute(clusterChrome, "height", 0);
    const neededTopY = Math.min(clusterY, targetLabelY - CLUSTER_LABEL_INSET_PX);
    const bottomY = clusterY + clusterHeight;
    const newHeight = bottomY - neededTopY;

    if (neededTopY < clusterY) {
      clusterChrome.setAttribute("y", String(neededTopY));
      clusterChrome.setAttribute("height", String(newHeight));
    }

    if (neededTopY < 0) {
      expandViewBoxUpward(svg, -neededTopY);
    }
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

  reserveClusterTitleBands(svg);
  wrapExistingNodeSvgLabels(svg, parsed);
  fitInventoryDiagramClusterFrames(svg);
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
