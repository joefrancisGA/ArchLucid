export const HELP_TECHNICAL_REFERENCE_GROUP_KEY_PARAM = "helpTechnicalReferenceGroupKey";

export function parseHelpTechnicalReferenceGroupKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpTechnicalReferenceGroupDisclosureHrefFromSearch(
  currentSearch: string,
  groupKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (groupKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_TECHNICAL_REFERENCE_GROUP_KEY_PARAM);
  } else {
    params.set(HELP_TECHNICAL_REFERENCE_GROUP_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
