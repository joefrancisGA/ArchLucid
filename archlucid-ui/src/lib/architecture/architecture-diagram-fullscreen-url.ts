export const ARCHITECTURE_DIAGRAM_FULLSCREEN_PARAM = "diagFullscreen";

export function parseArchitectureDiagramFullscreenOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
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
