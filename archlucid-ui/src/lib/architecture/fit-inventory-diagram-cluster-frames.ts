import {
  mapLocalBBoxToSvgUserSpace,
  mapSvgUserSpaceRectToElementLocal,
  readGraphicsElementBBox,
} from "@/lib/help/help-mermaid";

export const CLUSTER_FRAME_PAD_PX = 8;

export const CLUSTER_FRAME_MIN_TOP_PAD_PX = 16;

function formatCoordinate(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/u, "");
}

function isPackingCluster(cluster: Element): boolean {
  const id = cluster.id ?? "";
  const className = cluster.getAttribute("class") ?? "";

  return id.includes("alpack") || className.includes("alpack");
}

function listRenderableClusters(svg: Element): Element[] {
  return [...svg.querySelectorAll("g.cluster")].filter((cluster) => !isPackingCluster(cluster));
}

function listInventoryDiagramNodes(svg: SVGSVGElement): SVGGraphicsElement[] {
  const elements: SVGGraphicsElement[] = [];

  for (const selector of ["g.node", 'g[id^="node"]']) {
    for (const element of svg.querySelectorAll(selector)) {
      if (element instanceof SVGElement) {
        elements.push(element as SVGGraphicsElement);
      }
    }
  }

  return elements;
}

function descendantClusterCount(cluster: Element): number {
  return cluster.querySelectorAll("g.cluster").length;
}

function nearestClusterAncestor(element: Element): Element | null {
  let current = element.parentElement;

  while (current !== null) {
    if (current.classList.contains("cluster")) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function isClusterFrameShapeElement(element: Element): boolean {
  if (!(element instanceof SVGElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();

  return tagName === "rect" || tagName === "polygon" || tagName === "path";
}

function readClusterFrameShape(cluster: Element): SVGGraphicsElement | null {
  for (const child of cluster.children) {
    if (!isClusterFrameShapeElement(child)) {
      continue;
    }

    return child as SVGGraphicsElement;
  }

  return null;
}

function readClusterLabelElement(cluster: Element): SVGGraphicsElement | null {
  const label = cluster.querySelector(".cluster-label, :scope > text");

  if (label instanceof SVGElement) {
    return label as SVGGraphicsElement;
  }

  return null;
}

function pushMappedInk(
  boxes: DOMRect[],
  element: SVGGraphicsElement,
  svg: SVGSVGElement,
): void {
  const localBox = readGraphicsElementBBox(element);

  if (localBox === null) {
    return;
  }

  const mapped = mapLocalBBoxToSvgUserSpace(element, svg, localBox);

  if (mapped !== null) {
    boxes.push(mapped);
  }
}

function unionDomRects(rects: readonly DOMRect[]): DOMRect | null {
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

function collectMemberInkBoxes(cluster: Element, svg: SVGSVGElement): DOMRect[] {
  const boxes: DOMRect[] = [];

  for (const node of listInventoryDiagramNodes(svg)) {
    if (!cluster.contains(node)) {
      continue;
    }

    if (nearestClusterAncestor(node) !== cluster) {
      continue;
    }

    pushMappedInk(boxes, node, svg);
  }

  for (const nestedCluster of cluster.querySelectorAll("g.cluster")) {
    if (nestedCluster === cluster || isPackingCluster(nestedCluster)) {
      continue;
    }

    const nestedFrame = readClusterFrameShape(nestedCluster);

    if (nestedFrame !== null) {
      pushMappedInk(boxes, nestedFrame, svg);
    }
  }

  const label = readClusterLabelElement(cluster);

  if (label !== null) {
    pushMappedInk(boxes, label, svg);
  }

  return boxes;
}

function applyPadding(union: DOMRect, labelMeasured: boolean): DOMRect {
  const topPad = labelMeasured ? CLUSTER_FRAME_PAD_PX : CLUSTER_FRAME_MIN_TOP_PAD_PX;

  return new DOMRect(
    union.x - CLUSTER_FRAME_PAD_PX,
    union.y - topPad,
    union.width + CLUSTER_FRAME_PAD_PX * 2,
    union.height + topPad + CLUSTER_FRAME_PAD_PX,
  );
}

function writeClusterFrameRect(frame: SVGGraphicsElement, localRect: DOMRect): void {
  const tagName = frame.tagName.toLowerCase();

  if (tagName === "rect") {
    frame.setAttribute("x", formatCoordinate(localRect.x));
    frame.setAttribute("y", formatCoordinate(localRect.y));
    frame.setAttribute("width", formatCoordinate(localRect.width));
    frame.setAttribute("height", formatCoordinate(localRect.height));

    return;
  }

  if (tagName === "polygon") {
    const right = localRect.x + localRect.width;
    const bottom = localRect.y + localRect.height;
    const points = [
      [localRect.x, localRect.y],
      [right, localRect.y],
      [right, bottom],
      [localRect.x, bottom],
    ]
      .map(([x, y]) => `${formatCoordinate(x)},${formatCoordinate(y)}`)
      .join(" ");
    frame.setAttribute("points", points);
  }
}

function fitClusterFrame(cluster: Element, svg: SVGSVGElement): void {
  const frame = readClusterFrameShape(cluster);

  if (frame === null) {
    return;
  }

  const memberBoxes = collectMemberInkBoxes(cluster, svg);
  const union = unionDomRects(memberBoxes);

  if (union === null) {
    return;
  }

  const labelMeasured = readClusterLabelElement(cluster) !== null;
  const paddedUnion = applyPadding(union, labelMeasured);
  const clusterGraphics = cluster as SVGGraphicsElement;
  const localRect = mapSvgUserSpaceRectToElementLocal(clusterGraphics, svg, paddedUnion);

  if (localRect === null) {
    return;
  }

  writeClusterFrameRect(frame, localRect);
}

/**
 * Resizes existing Mermaid / Graphviz cluster chrome so every member node fits inside
 * the swimlane frame after labels are final. No-op when the SVG has no clusters.
 */
export function fitInventoryDiagramClusterFrames(svg: Element): void {
  if (svg.localName.toLowerCase() !== "svg") {
    return;
  }

  const svgRoot = svg as SVGSVGElement;
  const clusters = listRenderableClusters(svg);

  if (clusters.length === 0) {
    return;
  }

  const orderedClusters = [...clusters].sort(
    (left, right) => descendantClusterCount(left) - descendantClusterCount(right),
  );

  for (const cluster of orderedClusters) {
    fitClusterFrame(cluster, svgRoot);
  }
}
