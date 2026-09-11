export const ARCHITECTURE_DIAGRAM_FULLSCREEN_PARAM = "diagFullscreen";
export const ARCHITECTURE_DIAGRAM_ZOOM_PARAM = "diagZoom";

const MIN_DIAGRAM_ZOOM = 0.5;
const MAX_DIAGRAM_ZOOM = 2.5;

export function parseArchitectureDiagramFullscreenOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseArchitectureDiagramZoomFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(MAX_DIAGRAM_ZOOM, Math.max(MIN_DIAGRAM_ZOOM, Number(parsed.toFixed(2))));
}

export function architectureDiagramFullscreenHrefFromSearch(
  currentSearch: string,
  fullscreenOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!fullscreenOpen) {
    params.delete(ARCHITECTURE_DIAGRAM_FULLSCREEN_PARAM);
  } else {
    params.set(ARCHITECTURE_DIAGRAM_FULLSCREEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function architectureDiagramZoomHrefFromSearch(
  currentSearch: string,
  zoom: number | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (zoom === null || Math.abs(zoom - 1) < 0.001) {
    params.delete(ARCHITECTURE_DIAGRAM_ZOOM_PARAM);
  } else {
    params.set(ARCHITECTURE_DIAGRAM_ZOOM_PARAM, zoom.toFixed(2));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
