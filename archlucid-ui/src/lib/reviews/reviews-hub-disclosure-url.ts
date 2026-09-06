export const REVIEWS_HUB_MORE_WAYS_OPEN_PARAM = "reviewsHubMoreWaysOpen";
export const REVIEWS_HUB_MEDIAN_DELTA_OPEN_PARAM = "reviewsHubMedianDeltaOpen";
export const REVIEWS_HUB_REVIEW_CYCLE_DELTA_OPEN_PARAM = "reviewsHubReviewCycleDeltaOpen";

export type ReviewsHubDisclosureUrlState = {
  readonly moreWaysOpen: boolean;
  readonly medianDeltaOpen: boolean;
  readonly reviewCycleDeltaOpen: boolean;
};

function parseBooleanOpenParam(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReviewsHubMoreWaysOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseReviewsHubMedianDeltaOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseReviewsHubReviewCycleDeltaOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function reviewsHubDisclosureHrefFromSearch(
  currentSearch: string,
  state: ReviewsHubDisclosureUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.moreWaysOpen) {
    params.delete(REVIEWS_HUB_MORE_WAYS_OPEN_PARAM);
  } else {
    params.set(REVIEWS_HUB_MORE_WAYS_OPEN_PARAM, "1");
  }

  if (!state.medianDeltaOpen) {
    params.delete(REVIEWS_HUB_MEDIAN_DELTA_OPEN_PARAM);
  } else {
    params.set(REVIEWS_HUB_MEDIAN_DELTA_OPEN_PARAM, "1");
  }

  if (!state.reviewCycleDeltaOpen) {
    params.delete(REVIEWS_HUB_REVIEW_CYCLE_DELTA_OPEN_PARAM);
  } else {
    params.set(REVIEWS_HUB_REVIEW_CYCLE_DELTA_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
