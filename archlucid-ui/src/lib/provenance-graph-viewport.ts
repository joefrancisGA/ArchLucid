import type { ProvenanceGraphBounds } from "@/lib/provenance-graph-layout";

export const PROVENANCE_GRAPH_MIN_HEIGHT_PX = 580;
export const PROVENANCE_GRAPH_FIT_PADDING_PX = 40;
export const PROVENANCE_GRAPH_MIN_ZOOM = 0.25;
export const PROVENANCE_GRAPH_MAX_ZOOM = 3;
export const PROVENANCE_GRAPH_ZOOM_STEP = 1.15;
/** Minimum initial fit scale — prefer panning over shrinking labels below legibility. */
export const PROVENANCE_GRAPH_MIN_FIT_SCALE = 0.8;
export const PROVENANCE_GRAPH_MIN_LABEL_FONT_PX = 11;

export type ProvenanceViewportTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

export function clampProvenanceZoom(scale: number): number {
  return Math.min(PROVENANCE_GRAPH_MAX_ZOOM, Math.max(PROVENANCE_GRAPH_MIN_ZOOM, scale));
}

export function computeFitToViewTransform(
  bounds: ProvenanceGraphBounds,
  containerWidth: number,
  containerHeight: number,
  padding: number = PROVENANCE_GRAPH_FIT_PADDING_PX,
): ProvenanceViewportTransform {
  if (containerWidth <= 0 || containerHeight <= 0 || bounds.width <= 0 || bounds.height <= 0) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  const availableWidth = Math.max(1, containerWidth - padding * 2);
  const availableHeight = Math.max(1, containerHeight - padding * 2);
  const fitScale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
  const scale = clampProvenanceZoom(Math.max(fitScale, PROVENANCE_GRAPH_MIN_FIT_SCALE));
  const contentCenterX = bounds.minX + bounds.width / 2;
  const contentCenterY = bounds.minY + bounds.height / 2;
  const translateX = containerWidth / 2 - contentCenterX * scale;
  const translateY = containerHeight / 2 - contentCenterY * scale;

  return { scale, translateX, translateY };
}

export function applyProvenanceZoomAtPoint(
  current: ProvenanceViewportTransform,
  nextScale: number,
  focalX: number,
  focalY: number,
): ProvenanceViewportTransform {
  const scale = clampProvenanceZoom(nextScale);
  const contentX = (focalX - current.translateX) / current.scale;
  const contentY = (focalY - current.translateY) / current.scale;

  return {
    scale,
    translateX: focalX - contentX * scale,
    translateY: focalY - contentY * scale,
  };
}

export function provenanceTransformToSvg(transform: ProvenanceViewportTransform): string {
  return `translate(${transform.translateX} ${transform.translateY}) scale(${transform.scale})`;
}

export function provenancePanTransform(
  current: ProvenanceViewportTransform,
  deltaX: number,
  deltaY: number,
): ProvenanceViewportTransform {
  return {
    scale: current.scale,
    translateX: current.translateX + deltaX,
    translateY: current.translateY + deltaY,
  };
}
