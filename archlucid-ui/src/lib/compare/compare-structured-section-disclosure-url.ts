import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_STRUCTURED_SECTION_KEY_PARAM = "compareStructuredSectionKey";

export function parseCompareStructuredSectionKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function compareStructuredSectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (sectionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(COMPARE_STRUCTURED_SECTION_KEY_PARAM);
    } else {
      params.set(COMPARE_STRUCTURED_SECTION_KEY_PARAM, trimmed);
    }
    },
  });
}
