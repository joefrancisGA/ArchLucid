import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PROJECTS_RECYCLE_BIN_SOURCES_OPEN_PARAM);
}
