export const CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM = "citationChipsTechnicalCitationKey";

export function parseCitationChipsTechnicalCitationKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function citationChipsTechnicalCitationDisclosureHrefFromSearch(
  currentSearch: string,
  citationKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (citationKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM);
  } else {
    params.set(CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
