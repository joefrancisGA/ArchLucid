import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (sectionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_ENGINEERING_TROUBLESHOOTING_MARKDOWN_SECTION_KEY_PARAM);
    } else {
      params.set(HELP_ENGINEERING_TROUBLESHOOTING_MARKDOWN_SECTION_KEY_PARAM, trimmed);
    }
    },
  });
}
