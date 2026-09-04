export const TECHNOLOGY_BASELINE_ENTRY_PARAM = "techEntryId";

export function parseTechnologyBaselineEntryIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function technologyBaselineRationaleHrefFromSearch(
  currentSearch: string,
  entryId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (entryId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(TECHNOLOGY_BASELINE_ENTRY_PARAM);
  } else {
    params.set(TECHNOLOGY_BASELINE_ENTRY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
