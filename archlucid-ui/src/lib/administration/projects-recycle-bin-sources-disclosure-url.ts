export const PROJECTS_RECYCLE_BIN_SOURCES_OPEN_PARAM = "projectsRecycleBinSourcesOpen";

export function parseProjectsRecycleBinSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function projectsRecycleBinSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PROJECTS_RECYCLE_BIN_SOURCES_OPEN_PARAM);
  } else {
    params.set(PROJECTS_RECYCLE_BIN_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
