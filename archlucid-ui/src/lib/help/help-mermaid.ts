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
  if (typeof svg.createSVGPoint !== "function" || typeof element.getCTM !== "function") {
    return null;
  }

  const elementCtm = element.getCTM();
  const svgCtm = svg.getScreenCTM();

  if (elementCtm === null || svgCtm === null) {
    return null;
  }

  const toSvg = svgCtm.inverse().multiply(elementCtm);
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
 * After mount: crop the viewBox to drawn content and size the SVG to the host width in pixels.
 * Mermaid sometimes emits a large empty canvas with the graph clustered in one corner.
 */
const MERMAID_FIT_MIN_HEIGHT_PX = 280;

/** Base pixel dimensions after a contain-fit into a bounded viewport (inventory / architecture diagrams). */
export type MermaidViewportFitDimensions = {
  readonly baseWidthPx: number;
  readonly baseHeightPx: number;
};

/** Minimum fitted ink height before the inventory mermaid viewport treats the SVG as unpainted. */
export const MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX = 24;

export function isMermaidViewportPaintTooSmall(
  baseFit: MermaidViewportFitDimensions | null,
  zoom: number,
): boolean {
  if (baseFit === null) {
    return true;
  }

  return baseFit.baseHeightPx * zoom < MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX;
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
  const bbox = readMermaidInkBBox(svg);

  if (bbox === null) {
    svg.setAttribute("width", "100%");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.maxWidth = "none";
    svg.style.display = "block";

    return null;
  }

  const { viewWidth, viewHeight } = applyMermaidSvgInkViewBox(svg, bbox, paddingPx);
  const availableWidth = Math.max(1, viewportWidthPx - paddingPx * 2);
  const availableHeight = Math.max(1, viewportHeightPx - paddingPx * 2);
  const scale = Math.min(availableWidth / viewWidth, availableHeight / viewHeight);
  const baseWidthPx = Math.max(1, Math.round(viewWidth * scale));
  const baseHeightPx = Math.max(1, Math.round(viewHeight * scale));

  applyMermaidSvgPixelSize(svg, baseWidthPx, baseHeightPx);

  return { baseWidthPx, baseHeightPx };
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
