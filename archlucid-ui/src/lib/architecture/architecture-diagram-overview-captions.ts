const SVG_NS = "http://www.w3.org/2000/svg";

export const DIAGRAM_OVERVIEW_CAPTION_MAX_SCALE = 0.45;
export const OVERVIEW_CAPTION_MIN_FRAME_PX = 18;
const OVERVIEW_CAPTION_FONT_SIZE_PX = 14;
const MAX_OVERVIEW_NAME_LENGTH = 32;

type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function readRect(element: Element | null): Rect | null {
  if (element === null) {
    return null;
  }

  const values = ["x", "y", "width", "height"].map((attribute) => {
    const raw = element.getAttribute(attribute);
    return raw === null && (attribute === "x" || attribute === "y")
      ? 0
      : Number.parseFloat(raw ?? "");
  });

  if (values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [x, y, width, height] = values;
  return { x, y, width, height };
}

function readTranslate(element: Element): { x: number; y: number } {
  const match = (element.getAttribute("transform") ?? "").match(
    /^\s*translate\(\s*([-+.\d]+)(?:[\s,]+([-+.\d]+))?\s*\)/u,
  );

  if (match === null) {
    return { x: 0, y: 0 };
  }

  return {
    x: Number.parseFloat(match[1] ?? "0"),
    y: Number.parseFloat(match[2] ?? "0"),
  };
}

function isInside(point: { x: number; y: number }, rect: Rect): boolean {
  return (
    point.x >= rect.x
    && point.x < rect.x + rect.width
    && point.y >= rect.y
    && point.y < rect.y + rect.height
  );
}

function readNodeCenter(node: Element): { x: number; y: number } | null {
  const card = node.querySelector("rect.node-card");
  const rect = readRect(card);

  if (rect === null) {
    return null;
  }

  const translate = readTranslate(node);
  return {
    x: translate.x + rect.x + rect.width / 2,
    y: translate.y + rect.y + rect.height / 2,
  };
}

export function isDiagramOverviewScale(scale: number): boolean {
  return Number.isFinite(scale) && scale < DIAGRAM_OVERVIEW_CAPTION_MAX_SCALE;
}

export function truncateOverviewName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > MAX_OVERVIEW_NAME_LENGTH
    ? `${trimmed.slice(0, MAX_OVERVIEW_NAME_LENGTH)}…`
    : trimmed;
}

export function formatOverviewCaption(name: string, count: number): string {
  return `${truncateOverviewName(name)} · ${count}`;
}

function countNodesInside(svg: SVGSVGElement, frameRect: Rect): number {
  return [...svg.querySelectorAll("g.node")]
    .map(readNodeCenter)
    .filter((center): center is { x: number; y: number } => center !== null)
    .filter((center) => isInside(center, frameRect)).length;
}

function frameRect(frame: Element): Rect | null {
  if (frame.classList.contains("rg-frame")) {
    return readRect(frame.querySelector("rect.rg-frame-plate"));
  }

  if (frame.classList.contains("vnet-frame")) {
    return readRect(frame.querySelector(":scope > rect"));
  }

  return null;
}

function hideOriginalFrameCaption(frame: Element): void {
  frame.querySelectorAll(":scope > text, :scope > g.azure-icon, g.vnet-frame-caption, rect.rg-frame-label-halo, rect.vnet-frame-label-halo")
    .forEach((element) => {
      element.classList.add("diagram-overview-hidden");
    });
}

function clearOverviewState(svg: SVGSVGElement): void {
  svg.querySelectorAll(".diagram-overview-hidden").forEach((element) => {
    element.classList.remove("diagram-overview-hidden");
  });
  svg.querySelector("g.overview-captions")?.remove();
}

export function readDiagramPaintedScale(svg: SVGSVGElement): number | null {
  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/u).map(Number);
  const viewBoxWidth = viewBox[2];
  const paintedWidth = svg.getBoundingClientRect().width;

  if (!Number.isFinite(viewBoxWidth) || viewBoxWidth <= 0 || !Number.isFinite(paintedWidth) || paintedWidth <= 0) {
    return null;
  }

  return paintedWidth / viewBoxWidth;
}

export function applyDiagramOverviewCaptions(svg: SVGSVGElement, paintedScale: number): void {
  clearOverviewState(svg);

  if (!isDiagramOverviewScale(paintedScale)) {
    return;
  }

  const captions = document.createElementNS(SVG_NS, "g");
  captions.setAttribute("class", "overview-captions");
  const defs = document.createElementNS(SVG_NS, "defs");
  captions.appendChild(defs);
  let captionCount = 0;

  svg.querySelectorAll("g.vnet-frame, g.rg-frame").forEach((frame) => {
    const rect = frameRect(frame);
    const name = frame.querySelector(":scope > title")?.textContent?.trim() ?? "";

    if (
      rect === null
      || name.length === 0
      || rect.height * paintedScale < OVERVIEW_CAPTION_MIN_FRAME_PX
    ) {
      return;
    }

    const clipId = `diagram-overview-clip-${captionCount}`;
    const clipPath = document.createElementNS(SVG_NS, "clipPath");
    clipPath.setAttribute("id", clipId);
    const clipRect = document.createElementNS(SVG_NS, "rect");
    clipRect.setAttribute("x", String(rect.x));
    clipRect.setAttribute("y", String(rect.y));
    clipRect.setAttribute("width", String(rect.width));
    clipRect.setAttribute("height", String(rect.height));
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    hideOriginalFrameCaption(frame);
    svg.querySelectorAll("g.node").forEach((node) => {
      const center = readNodeCenter(node);
      if (center !== null && isInside(center, rect)) {
        node.querySelectorAll("text").forEach((element) => {
          element.classList.add("diagram-overview-hidden");
        });
      }
    });

    const caption = document.createElementNS(SVG_NS, "text");
    caption.setAttribute("class", "overview-caption");
    caption.setAttribute("x", String(rect.x + 8 / paintedScale));
    caption.setAttribute("y", String(rect.y + 14 / paintedScale));
    caption.setAttribute("text-anchor", "start");
    caption.setAttribute("font-size", String(OVERVIEW_CAPTION_FONT_SIZE_PX / paintedScale));
    caption.setAttribute("font-weight", "700");
    caption.setAttribute("fill", "#334155");
    caption.setAttribute("clip-path", `url(#${clipId})`);
    caption.textContent = formatOverviewCaption(name, countNodesInside(svg, rect));
    captions.appendChild(caption);
    captionCount += 1;
  });

  if (captionCount > 0) {
    svg.appendChild(captions);
  }
}
