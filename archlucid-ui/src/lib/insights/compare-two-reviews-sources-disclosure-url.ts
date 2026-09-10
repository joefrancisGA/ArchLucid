export const COMPARE_TWO_REVIEWS_SOURCES_OPEN_PARAM = "compareTwoReviewsSourcesOpen";

export function parseCompareTwoReviewsSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareTwoReviewsSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(COMPARE_TWO_REVIEWS_SOURCES_OPEN_PARAM);
  } else {
    params.set(COMPARE_TWO_REVIEWS_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
