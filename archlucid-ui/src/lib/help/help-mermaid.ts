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
 * Mermaid.render inserts a bind node (`#d{id}`) and, on parse failure, an error SVG
 * with the same id into document.body. Leaving those nodes in place stacks
 * "Syntax error in text" banners on every retry.
 */
export function removeMermaidRenderBindElement(renderId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const trimmed = renderId.trim();

  if (trimmed.length === 0) {
    return;
  }

  document.getElementById(`d${trimmed}`)?.remove();
  document.getElementById(`i${trimmed}`)?.remove();
  document.getElementById(trimmed)?.remove();
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

  const existingViewBox = svg.getAttribute("viewBox");

  if (existingViewBox !== null && existingViewBox.trim().length > 0) {
    svg.setAttribute(MERMAID_SOURCE_VIEWBOX_ATTR, existingViewBox);
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

/**
 * Union of node boxes only — excludes edge paths whose Bézier bbox inflates the plate.
 */
function readMappedNodeUnionBBox(svg: SVGSVGElement): { union: DOMRect; nodeCount: number } | null {
  const inkBoxes: DOMRect[] = [];

  for (const element of svg.querySelectorAll("g.node")) {
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

  const union = unionDomRects(inkBoxes);

  if (union === null) {
    return null;
  }

  return { union, nodeCount: inkBoxes.length };
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

  return unionDomRects(inkBoxes);
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

/** Mermaid theme font size for inventory / architecture diagrams. */
export const MERMAID_NATURAL_LABEL_FONT_PX = 15;

/** Minimum readable label size before the viewport scrolls instead of shrinking further. */
export const MERMAID_MIN_LEGIBLE_LABEL_FONT_PX = 11;

/** Never shrink below this scale of Mermaid's natural ink size. */
export const MERMAID_VIEWPORT_MIN_FIT_SCALE = MERMAID_MIN_LEGIBLE_LABEL_FONT_PX / MERMAID_NATURAL_LABEL_FONT_PX;

/** Never upscale past Mermaid's natural ink size on the viewport path. */
export const MERMAID_VIEWPORT_MAX_FIT_SCALE = 1;

const MERMAID_SOURCE_VIEWBOX_ATTR = "data-al-source-viewbox";

/** Base pixel dimensions after a contain-fit into a bounded viewport (inventory / architecture diagrams). */
export type MermaidViewportFitDimensions = {
  readonly baseWidthPx: number;
  readonly baseHeightPx: number;
  /** False when the SVG was sized to the camera budget without a measurable ink bbox. */
  readonly inkMeasured: boolean;
  readonly fitScale: number;
  readonly overflows: boolean;
};

/** Minimum fitted ink height before the inventory mermaid viewport treats the SVG as unpainted. */
export const MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX = 24;

export function isMermaidViewportPaintTooSmall(
  baseFit: MermaidViewportFitDimensions | null,
  zoom: number,
): boolean {
  if (baseFit === null || !baseFit.inkMeasured) {
    return true;
  }

  return baseFit.baseHeightPx * zoom < MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX;
}

/** True while contain-fit only reserved a frame and has not yet found drawable ink. */
export function mermaidViewportFitNeedsRetry(baseFit: MermaidViewportFitDimensions | null): boolean {
  return baseFit === null || !baseFit.inkMeasured;
}

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

function parseSvgViewBoxAttribute(raw: string | null): DOMRect | null {
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  const parts = raw.trim().split(/[\s,]+/u).map((part) => Number.parseFloat(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [x, y, width, height] = parts;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return new DOMRect(x, y, width, height);
}

function readMermaidSourceViewBox(svg: SVGSVGElement): DOMRect | null {
  const fromAttribute = parseSvgViewBoxAttribute(svg.getAttribute(MERMAID_SOURCE_VIEWBOX_ATTR));

  if (fromAttribute !== null) {
    return fromAttribute;
  }

  return parseSvgViewBoxAttribute(svg.getAttribute("viewBox"));
}

/** Measured ink may tighten Mermaid's padded canvas; it must never clip rows or columns. */
export function resolveMermaidInkViewBox(
  sourceViewBox: DOMRect | null,
  measuredInk: DOMRect | null,
  paddingPx: number,
): DOMRect | null {
  if (sourceViewBox === null) {
    if (measuredInk === null) {
      return null;
    }

    return new DOMRect(
      measuredInk.x - paddingPx,
      measuredInk.y - paddingPx,
      measuredInk.width + paddingPx * 2,
      measuredInk.height + paddingPx * 2,
    );
  }

  if (measuredInk === null) {
    return sourceViewBox;
  }

  const measuredInsideSource =
    measuredInk.x >= sourceViewBox.x
    && measuredInk.y >= sourceViewBox.y
    && measuredInk.x + measuredInk.width <= sourceViewBox.x + sourceViewBox.width
    && measuredInk.y + measuredInk.height <= sourceViewBox.y + sourceViewBox.height;
  const measuredLargeEnough =
    measuredInk.width >= sourceViewBox.width * 0.6 && measuredInk.height >= sourceViewBox.height * 0.6;
  // Mis-mapped ink often sits inside the source box but clips the first row/column; require flush edges.
  const measuredCoversSourceExtents =
    measuredInk.x <= sourceViewBox.x + paddingPx
    && measuredInk.y <= sourceViewBox.y + paddingPx
    && measuredInk.x + measuredInk.width >= sourceViewBox.x + sourceViewBox.width - paddingPx
    && measuredInk.y + measuredInk.height >= sourceViewBox.y + sourceViewBox.height - paddingPx;

  if (measuredInsideSource && measuredLargeEnough && measuredCoversSourceExtents) {
    return new DOMRect(
      measuredInk.x - paddingPx,
      measuredInk.y - paddingPx,
      measuredInk.width + paddingPx * 2,
      measuredInk.height + paddingPx * 2,
    );
  }

  return sourceViewBox;
}

/** Crop to the union of node boxes when every g.node mapped; never clip a missing row. */
export function resolveMermaidNodeUnionViewBox(
  sourceViewBox: DOMRect | null,
  nodeUnion: DOMRect | null,
  measuredNodeCount: number,
  expectedNodeCount: number,
  paddingPx: number,
): DOMRect | null {
  if (nodeUnion === null || expectedNodeCount === 0 || measuredNodeCount !== expectedNodeCount) {
    return sourceViewBox;
  }

  if (sourceViewBox === null) {
    return new DOMRect(
      nodeUnion.x - paddingPx,
      nodeUnion.y - paddingPx,
      nodeUnion.width + paddingPx * 2,
      nodeUnion.height + paddingPx * 2,
    );
  }

  const tolerance = 1;
  const unionInsideSource =
    nodeUnion.x >= sourceViewBox.x - tolerance
    && nodeUnion.y >= sourceViewBox.y - tolerance
    && nodeUnion.x + nodeUnion.width <= sourceViewBox.x + sourceViewBox.width + tolerance
    && nodeUnion.y + nodeUnion.height <= sourceViewBox.y + sourceViewBox.height + tolerance;

  if (!unionInsideSource) {
    return sourceViewBox;
  }

  return new DOMRect(
    nodeUnion.x - paddingPx,
    nodeUnion.y - paddingPx,
    nodeUnion.width + paddingPx * 2,
    nodeUnion.height + paddingPx * 2,
  );
}

function ensureMermaidInkViewBox(
  svg: SVGSVGElement,
  paddingPx: number,
): { viewWidth: number; viewHeight: number } | null {
  const cached = mermaidInkViewBoxBySvg.get(svg);

  if (cached !== undefined) {
    return cached;
  }

  const sourceViewBox = readMermaidSourceViewBox(svg);
  const expectedNodeCount = svg.querySelectorAll("g.node").length;
  const nodeUnionResult = readMappedNodeUnionBBox(svg);
  let resolvedViewBox: DOMRect | null;

  if (nodeUnionResult !== null && expectedNodeCount > 0) {
    resolvedViewBox = resolveMermaidNodeUnionViewBox(
      sourceViewBox,
      nodeUnionResult.union,
      nodeUnionResult.nodeCount,
      expectedNodeCount,
      paddingPx,
    );
  }
  else {
    const measuredInk = readMermaidInkBBox(svg);
    resolvedViewBox = resolveMermaidInkViewBox(sourceViewBox, measuredInk, paddingPx);
  }

  if (resolvedViewBox === null) {
    return null;
  }

  const viewDims = applyMermaidSvgViewBoxRect(svg, resolvedViewBox, true);
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

  return {
    baseWidthPx: widthPx,
    baseHeightPx: heightPx,
    inkMeasured: false,
    fitScale: 1,
    overflows: false,
  };
}

function applyMermaidSvgViewBoxRect(
  svg: SVGSVGElement,
  viewBox: DOMRect,
  forViewport: boolean,
): { viewWidth: number; viewHeight: number } {
  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.display = "block";

  if (forViewport) {
    svg.style.maxWidth = "none";
  }
  else {
    svg.style.maxWidth = "100%";
  }

  return { viewWidth: viewBox.width, viewHeight: viewBox.height };
}

function applyMermaidSvgInkViewBox(
  svg: SVGSVGElement,
  ink: DOMRect,
  paddingPx: number,
  forViewport: boolean,
): { viewWidth: number; viewHeight: number } {
  const viewBox = new DOMRect(
    ink.x - paddingPx,
    ink.y - paddingPx,
    ink.width + paddingPx * 2,
    ink.height + paddingPx * 2,
  );

  return applyMermaidSvgViewBoxRect(svg, viewBox, forViewport);
}

function applyMermaidSvgPixelSize(svg: SVGSVGElement, widthPx: number, heightPx: number): void {
  const width = Math.max(1, Math.round(widthPx));
  const height = Math.max(1, Math.round(heightPx));

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.maxWidth = "none";
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
  const rawScale = Math.min(availableWidth / viewWidth, availableHeight / viewHeight);
  const fitScale = Math.min(
    MERMAID_VIEWPORT_MAX_FIT_SCALE,
    Math.max(MERMAID_VIEWPORT_MIN_FIT_SCALE, rawScale),
  );
  const baseWidthPx = Math.max(1, Math.round(viewWidth * fitScale));
  const baseHeightPx = Math.max(1, Math.round(viewHeight * fitScale));
  const overflows = baseWidthPx > availableWidth || baseHeightPx > availableHeight;

  applyMermaidSvgPixelSize(svg, baseWidthPx, baseHeightPx);

  return { baseWidthPx, baseHeightPx, inkMeasured: true, fitScale, overflows };
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

  const { viewWidth, viewHeight } = applyMermaidSvgInkViewBox(svg, bbox, paddingPx, false);
  const width = Math.max(1, Math.floor(hostWidthPx));
  const proportionalHeight = Math.max(1, Math.round(width * (viewHeight / viewWidth)));
  const height = Math.max(minHeightPx, proportionalHeight);

  applyMermaidSvgPixelSize(svg, width, height);
}
