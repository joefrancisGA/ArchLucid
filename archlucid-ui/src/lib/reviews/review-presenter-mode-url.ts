export const REVIEW_PRESENTER_MODE_PARAM = "presenter";

export function parseReviewPresenterModeFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewPresenterModeHrefFromSearch(
  currentSearch: string,
  presenterMode: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!presenterMode) {
    params.delete(REVIEW_PRESENTER_MODE_PARAM);
  } else {
    params.set(REVIEW_PRESENTER_MODE_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
