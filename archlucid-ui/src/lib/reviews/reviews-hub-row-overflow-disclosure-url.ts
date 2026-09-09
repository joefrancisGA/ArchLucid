export const REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM = "reviewsHubRowOverflowRunId";

export function parseReviewsHubRowOverflowRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function reviewsHubRowOverflowDisclosureHrefFromSearch(
  currentSearch: string,
  runId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (runId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM);
  } else {
    params.set(REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
