import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDINGS_FILTER_PANEL_OPEN_PARAM = "findingsFilterPanelOpen";

export function parseFindingsFilterPanelOpenFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed === "1" || trimmed === "true";
}

export function runDetailFindingsFilterDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDINGS_FILTER_PANEL_OPEN_PARAM);
}
