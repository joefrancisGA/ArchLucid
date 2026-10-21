import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM = "reviewChainOfCustodySectionKey";

export function parseReviewChainOfCustodySectionKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function reviewChainOfCustodySectionDisclosureHrefFromSearch(
  currentSearch: string,
  sectionKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (sectionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM);
    } else {
      params.set(REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM, trimmed);
    }
    },
  });
}
