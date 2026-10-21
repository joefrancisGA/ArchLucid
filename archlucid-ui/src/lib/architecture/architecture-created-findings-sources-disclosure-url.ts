import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_CREATED_FINDINGS_SOURCES_OPEN_PARAM = "architectureCreatedFindingsSourcesOpen";

export function parseArchitectureCreatedFindingsSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureCreatedFindingsSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_CREATED_FINDINGS_SOURCES_OPEN_PARAM);
}
