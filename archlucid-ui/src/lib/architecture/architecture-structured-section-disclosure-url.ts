import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (sectionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM);
    } else {
      params.set(ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM, trimmed);
    }
    },
  });
}
