import {
  helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch,
} from "@/lib/help/help-engineering-troubleshooting-markdown-section-disclosure-url";
import { applyOperatorUrlSelectionSwitch } from "@/lib/operator/operator-url-selection-switch";

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

  const hygieneParams = new URLSearchParams(currentSearch);

  applyOperatorUrlSelectionSwitch(hygieneParams, { kind: "disclosure-only" });

  const base = helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch(
    hygieneParams.toString(),
    trimmed,
    pathname,
  );

  return `${base}#${trimmed}`;
}
