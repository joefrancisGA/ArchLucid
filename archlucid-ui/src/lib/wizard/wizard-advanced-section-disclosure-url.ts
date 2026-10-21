import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (sectionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(WIZARD_ADVANCED_SECTION_KEY_PARAM);
    } else {
      params.set(WIZARD_ADVANCED_SECTION_KEY_PARAM, trimmed);
    }
    },
  });
}
