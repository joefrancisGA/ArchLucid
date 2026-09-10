export const REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM = "reviewsNewMoreWaysToStartOpen";

export function parseReviewsNewMoreWaysToStartOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewsNewMoreWaysToStartDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM);
  } else {
    params.set(REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
