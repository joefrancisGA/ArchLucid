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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (sectionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM);
  } else {
    params.set(REVIEW_CHAIN_OF_CUSTODY_SECTION_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
