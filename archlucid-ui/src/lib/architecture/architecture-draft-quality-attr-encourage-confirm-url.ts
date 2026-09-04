export const ARCHITECTURE_DRAFT_QUALITY_ATTR_ENCOURAGE_PARAM = "qualityAttrEncourage";

export function parseArchitectureDraftQualityAttrEncourageOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDraftQualityAttrEncourageConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(ARCHITECTURE_DRAFT_QUALITY_ATTR_ENCOURAGE_PARAM);
  } else {
    params.set(ARCHITECTURE_DRAFT_QUALITY_ATTR_ENCOURAGE_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
