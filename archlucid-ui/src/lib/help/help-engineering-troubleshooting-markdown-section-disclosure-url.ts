export const HELP_ENGINEERING_TROUBLESHOOTING_MARKDOWN_SECTION_KEY_PARAM =
  "helpEngineeringTroubleshootingMarkdownSectionKey";

export function parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (sectionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_ENGINEERING_TROUBLESHOOTING_MARKDOWN_SECTION_KEY_PARAM);
  } else {
    params.set(HELP_ENGINEERING_TROUBLESHOOTING_MARKDOWN_SECTION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
