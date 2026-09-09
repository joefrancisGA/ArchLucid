export const WIZARD_ADVANCED_SECTION_KEY_PARAM = "wizardAdvancedSectionKey";

export function parseWizardAdvancedSectionKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function wizardAdvancedSectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (sectionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(WIZARD_ADVANCED_SECTION_KEY_PARAM);
  } else {
    params.set(WIZARD_ADVANCED_SECTION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
