export const ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM = "architectureStructuredSectionKey";

export function parseArchitectureStructuredSectionKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function architectureStructuredSectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (sectionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM);
  } else {
    params.set(ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
