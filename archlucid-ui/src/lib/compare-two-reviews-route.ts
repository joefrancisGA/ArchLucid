/** Canonical Compare two reviews (left-nav label); formerly `/compare` (retired — no redirect). */
export const COMPARE_TWO_REVIEWS_PATH = "/insights/compare-two-reviews" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_COMPARE_PATH = "/compare" as const;

export function isCompareTwoReviewsPath(pathname: string): boolean {
  return (
    pathname === COMPARE_TWO_REVIEWS_PATH || pathname.startsWith(`${COMPARE_TWO_REVIEWS_PATH}/`)
  );
}

/** Builds Compare two reviews href with optional query. */
export function compareTwoReviewsHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return COMPARE_TWO_REVIEWS_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${COMPARE_TWO_REVIEWS_PATH}?${qs}` : COMPARE_TWO_REVIEWS_PATH;
}
