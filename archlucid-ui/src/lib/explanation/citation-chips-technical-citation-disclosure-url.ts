import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM = "citationChipsTechnicalCitationKey";

export function parseCitationChipsTechnicalCitationKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function citationChipsTechnicalCitationDisclosureHrefFromSearch(
  currentSearch: string,
  citationKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (citationKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM);
    } else {
      params.set(CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM, trimmed);
    }
    },
  });
}
