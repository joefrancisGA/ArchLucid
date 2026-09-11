const MERMAID_DIAGRAM_START =
  /^(?:flowchart|graph\s+(?:TD|TB|BT|RL|LR|DT|DR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie\s|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i;

/** True when a fenced block should render as a Mermaid diagram instead of monospace source. */
export function isMermaidDiagramSource(code: string, language?: string): boolean {
  const lang = (language ?? "").trim().toLowerCase();

  if (lang === "mermaid" || lang === "mmd") {
    return true;
  }

  return MERMAID_DIAGRAM_START.test(code.trimStart());
}

/** Stable render ids for Mermaid — strips characters that break DOM id rules. */
export function sanitizeMermaidRenderId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Forces Mermaid SVG output to fill its container width.
 * Mermaid often emits a fixed pixel max-width (and sometimes height), which leaves a thumbnail
 * in a wide help-layout frame — especially after rendering inside a closed details disclosure.
 */
export function prepareMermaidSvgForResponsiveLayout(svgMarkup: string): string {
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

  const viewBox = svg.getAttribute("viewBox");

  if (viewBox === null || viewBox.trim() === "") {
    const widthAttr = svg.getAttribute("width");
    const heightAttr = svg.getAttribute("height");
    const width = widthAttr === null ? Number.NaN : Number.parseFloat(widthAttr);
    const height = heightAttr === null ? Number.NaN : Number.parseFloat(heightAttr);

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }

  svg.setAttribute("width", "100%");
  svg.removeAttribute("height");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("overflow", "visible");
  svg.style.removeProperty("max-width");
  svg.style.setProperty("width", "100%");
  svg.style.setProperty("height", "auto");
  svg.style.setProperty("display", "block");

  return new XMLSerializer().serializeToString(svg);
}

function readGraphicsElementBBox(element: SVGGraphicsElement): DOMRect | null {
  try {
    const box = element.getBBox();

    if (box.width > 1 && box.height > 1) {
      return box;
    }
  }
  catch {
    // getBBox throws when the node is not rendered yet.
  }

  return null;
}

function unionDomRects(rects: DOMRect[]): DOMRect | null {
  if (rects.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || maxX <= minX || maxY <= minY) {
    return null;
  }

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

function mapLocalBBoxToSvgUserSpace(
  element: SVGGraphicsElement,
  svg: SVGSVGElement,
  box: DOMRect,
): DOMRect | null {
  if (typeof svg.createSVGPoint !== "function" || typeof element.getScreenCTM !== "function") {
    return null;
  }

  const elementScreenCtm = element.getScreenCTM();
  const svgScreenCtm = svg.getScreenCTM();

  if (elementScreenCtm === null || svgScreenCtm === null) {
    return null;
  }

  const toSvg = svgScreenCtm.inverse().multiply(elementScreenCtm);
  const corners: Array<readonly [number, number]> = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of corners) {
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    const mapped = point.matrixTransform(toSvg);
    minX = Math.min(minX, mapped.x);
    minY = Math.min(minY, mapped.y);
    maxX = Math.max(maxX, mapped.x);
    maxY = Math.max(maxY, mapped.y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || maxX <= minX || maxY <= minY) {
    return null;
  }

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

function readMermaidGroupInkBBox(svg: SVGSVGElement): DOMRect | null {
  const candidates: Element[] = [
    ...svg.querySelectorAll("g.nodes, g.edgePaths, g.flowchart, g.output"),
    ...svg.querySelectorAll(":scope > g"),
    ...svg.querySelectorAll("g.clusters"),
  ];

  for (const candidate of candidates) {
    if (!(candidate instanceof SVGGraphicsElement)) {
      continue;
    }

    const box = readGraphicsElementBBox(candidate);

    if (box !== null) {
      return box;
    }
  }

  return readGraphicsElementBBox(svg);
}

function isLikelyOriginOnlyInkCrop(mappedInk: DOMRect, groupInk: DOMRect | null): boolean {
  if (groupInk === null) {
    return false;
  }

  const mappedNearOrigin = mappedInk.x < 80 && mappedInk.y < 80;
  const groupIsTranslated = groupInk.x > 80 || groupInk.y > 80;

  return mappedNearOrigin && groupIsTranslated && mappedInk.width < groupInk.width * 1.5;
}

/**
 * Prefer node/edge ink over cluster shells, but only in SVG user space.
 * Mermaid `.node` getBBox is local to a translated group; using it unmapped
 * crops the viewBox to the origin and hides the graph until the user scrolls.
 */
function readMappedNodeInkBBox(svg: SVGSVGElement): DOMRect | null {
  const inkElements = svg.querySelectorAll("g.node, g.edgePaths path, g.edgeLabel");
  const inkBoxes: DOMRect[] = [];

  for (const element of inkElements) {
    if (!(element instanceof SVGGraphicsElement)) {
      continue;
    }

    const localBox = readGraphicsElementBBox(element);

    if (localBox === null) {
      continue;
    }

    const mapped = mapLocalBBoxToSvgUserSpace(element, svg, localBox);

    if (mapped !== null) {
      inkBoxes.push(mapped);
    }
  }

  const mappedInk = unionDomRects(inkBoxes);

  if (mappedInk === null) {
    return null;
  }

  const groupInk = readMermaidGroupInkBBox(svg);

  if (isLikelyOriginOnlyInkCrop(mappedInk, groupInk)) {
    return groupInk;
  }

  return mappedInk;
}

function readMermaidInkBBox(svg: SVGSVGElement): DOMRect | null {
  const mappedInk = readMappedNodeInkBBox(svg);

  if (mappedInk !== null) {
    return mappedInk;
  }

  return readMermaidGroupInkBBox(svg);
}

/**
 * After mount: crop the viewBox to drawn content and size the SVG to the host width in pixels.
 * Mermaid sometimes emits a large empty canvas with the graph clustered in one corner.
 */
const MERMAID_FIT_MIN_HEIGHT_PX = 280;

/** Stable floor for inventory/architecture mermaid camera height (independent of collapsed content). */
export const MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX = 240;

/** Matches Tailwind max-h-[36rem] on the inventory diagram viewport. */
export const MERMAID_VIEWPORT_MAX_HEIGHT_PX = 576;

/** Base pixel dimensions after a contain-fit into a bounded viewport (inventory / architecture diagrams). */
export type MermaidViewportFitDimensions = {
  readonly baseWidthPx: number;
  readonly baseHeightPx: number;
};

type MermaidInkViewBoxCache = {
  readonly viewWidth: number;
  readonly viewHeight: number;
};

const mermaidInkViewBoxBySvg = new WeakMap<SVGSVGElement, MermaidInkViewBoxCache>();

function parseCssLengthToPx(raw: string, referenceFontSizePx: number, viewportHeightPx: number): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0 || trimmed === "none") {
    return null;
  }

  if (trimmed.endsWith("px")) {
    return Number.parseFloat(trimmed);
  }

  if (trimmed.endsWith("rem")) {
    return Number.parseFloat(trimmed) * referenceFontSizePx;
  }

  if (trimmed.endsWith("vh")) {
    return (Number.parseFloat(trimmed) * viewportHeightPx) / 100;
  }

  return null;
}

/**
 * Stable contain-fit budget for inventory/architecture mermaid canvases.
 * Uses CSS max-height, not the SVG's current content height (overlay chrome is absolute).
 */
export function readMermaidViewportFitBudget(viewport: HTMLElement): { widthPx: number; heightPx: number } {
  const style = getComputedStyle(viewport);
  const rootFontSizePx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
  const paddingY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const widthPx = Math.max(1, viewport.clientWidth - paddingX);
  const cssMaxHeightPx =
    parseCssLengthToPx(style.maxHeight, rootFontSizePx, window.innerHeight) ?? MERMAID_VIEWPORT_MAX_HEIGHT_PX;
  const cappedMaxHeightPx = Math.min(MERMAID_VIEWPORT_MAX_HEIGHT_PX, cssMaxHeightPx - paddingY);
  const proportionalHeight = Math.min(MERMAID_VIEWPORT_MAX_HEIGHT_PX, Math.max(MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX, widthPx * 0.5));
  const heightPx = Math.max(
    MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX,
    Math.min(cappedMaxHeightPx, proportionalHeight),
  );

  return { widthPx, heightPx };
}

function clearMermaidInkViewBoxCache(svg: SVGSVGElement): void {
  mermaidInkViewBoxBySvg.delete(svg);
}

function ensureMermaidInkViewBox(
  svg: SVGSVGElement,
  paddingPx: number,
): { viewWidth: number; viewHeight: number } | null {
  const cached = mermaidInkViewBoxBySvg.get(svg);

  if (cached !== undefined) {
    return cached;
  }

  const bbox = readMermaidInkBBox(svg);

  if (bbox === null) {
    return null;
  }

  const viewDims = applyMermaidSvgInkViewBox(svg, bbox, paddingPx);
  mermaidInkViewBoxBySvg.set(svg, viewDims);

  return viewDims;
}

function applyMermaidViewportNullInkFallback(
  svg: SVGSVGElement,
  viewportWidthPx: number,
  viewportHeightPx: number,
): MermaidViewportFitDimensions {
  const widthPx = Math.max(1, Math.round(viewportWidthPx));
  const heightPx = Math.max(
    MERMAID_VIEWPORT_STABLE_MIN_HEIGHT_PX,
    Math.min(MERMAID_VIEWPORT_MAX_HEIGHT_PX, Math.round(viewportHeightPx)),
  );

  applyMermaidSvgPixelSize(svg, widthPx, heightPx);

  return { baseWidthPx: widthPx, baseHeightPx: heightPx };
}

function applyMermaidSvgInkViewBox(
  svg: SVGSVGElement,
  bbox: DOMRect,
  paddingPx: number,
): { viewWidth: number; viewHeight: number } {
  const viewWidth = bbox.width + paddingPx * 2;
  const viewHeight = bbox.height + paddingPx * 2;

  svg.setAttribute(
    "viewBox",
    `${bbox.x - paddingPx} ${bbox.y - paddingPx} ${viewWidth} ${viewHeight}`,
  );
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.maxWidth = "100%";
  svg.style.display = "block";

  return { viewWidth, viewHeight };
}

function applyMermaidSvgPixelSize(svg: SVGSVGElement, widthPx: number, heightPx: number): void {
  const width = Math.max(1, Math.round(widthPx));
  const height = Math.max(1, Math.round(heightPx));

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
}

/**
 * Contain diagram ink inside a visible viewport box (width and height).
 * Used by inventory / architecture mermaid canvases — not help-topic width-fill.
 */
export function fitMermaidSvgElementToViewport(
  svg: SVGSVGElement,
  viewportWidthPx: number,
  viewportHeightPx: number,
  paddingPx = 12,
): MermaidViewportFitDimensions | null {
  const viewDims = ensureMermaidInkViewBox(svg, paddingPx);

  if (viewDims === null) {
    return applyMermaidViewportNullInkFallback(svg, viewportWidthPx, viewportHeightPx);
  }

  const { viewWidth, viewHeight } = viewDims;
  const availableWidth = Math.max(1, viewportWidthPx - paddingPx * 2);
  const availableHeight = Math.max(1, viewportHeightPx - paddingPx * 2);
  const scale = Math.min(availableWidth / viewWidth, availableHeight / viewHeight);
  const baseWidthPx = Math.max(1, Math.round(viewWidth * scale));
  const baseHeightPx = Math.max(1, Math.round(viewHeight * scale));

  applyMermaidSvgPixelSize(svg, baseWidthPx, baseHeightPx);

  return { baseWidthPx, baseHeightPx };
}

/** Drop cached ink viewBox when mermaid markup is replaced (new innerHTML). */
export function resetMermaidSvgViewportInkCache(svg: SVGSVGElement): void {
  clearMermaidInkViewBoxCache(svg);
}

/** Layout-affecting zoom on top of a viewport contain-fit (100% = fitted base size). */
export function applyMermaidSvgViewportZoom(
  svg: SVGSVGElement,
  baseFit: MermaidViewportFitDimensions,
  zoom: number,
): void {
  applyMermaidSvgPixelSize(
    svg,
    baseFit.baseWidthPx * zoom,
    baseFit.baseHeightPx * zoom,
  );
}

export function fitMermaidSvgElementToHost(
  svg: SVGSVGElement,
  hostWidthPx: number,
  paddingPx = 12,
  minHeightPx = MERMAID_FIT_MIN_HEIGHT_PX,
): void {
  const bbox = readMermaidInkBBox(svg);

  if (bbox === null) {
    svg.setAttribute("width", "100%");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.maxWidth = "none";
    svg.style.display = "block";

    return;
  }

  const { viewWidth, viewHeight } = applyMermaidSvgInkViewBox(svg, bbox, paddingPx);
  const width = Math.max(1, Math.floor(hostWidthPx));
  const proportionalHeight = Math.max(1, Math.round(width * (viewHeight / viewWidth)));
  const height = Math.max(minHeightPx, proportionalHeight);

  applyMermaidSvgPixelSize(svg, width, height);
}
