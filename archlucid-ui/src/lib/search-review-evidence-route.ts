/** Canonical Search review evidence (left-nav label); formerly `/search` (retired — no redirect). */
export const SEARCH_REVIEW_EVIDENCE_PATH = "/insights/search-review-evidence" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_SEARCH_PATH = "/search" as const;

export function isSearchReviewEvidencePath(pathname: string): boolean {
  return (
    pathname === SEARCH_REVIEW_EVIDENCE_PATH
    || pathname.startsWith(`${SEARCH_REVIEW_EVIDENCE_PATH}/`)
  );
}

/** Builds Search review evidence href with optional query. */
export function searchReviewEvidenceHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return SEARCH_REVIEW_EVIDENCE_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${SEARCH_REVIEW_EVIDENCE_PATH}?${qs}` : SEARCH_REVIEW_EVIDENCE_PATH;
}
