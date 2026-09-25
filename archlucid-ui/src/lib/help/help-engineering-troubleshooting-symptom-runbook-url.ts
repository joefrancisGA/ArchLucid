import {
  helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch,
} from "@/lib/help/help-engineering-troubleshooting-markdown-section-disclosure-url";

/** Deep-link a symptom row to an expanded markdown section (hash + disclosure param). */
export function helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch(
  currentSearch: string,
  sectionId: string,
  pathname: string,
): string {
  const trimmed = sectionId.trim();

  if (trimmed.length === 0) {
    return pathname;
  }

  const base = helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch(
    currentSearch,
    trimmed,
    pathname,
  );

  return `${base}#${trimmed}`;
}
