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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDINGS_FILTER_PANEL_OPEN_PARAM);
  } else {
    params.set(FINDINGS_FILTER_PANEL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
