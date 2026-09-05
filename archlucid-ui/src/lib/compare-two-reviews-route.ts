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

/** Pre-fills the base (prior) side when opening Compare from a review context (PT-20). */
export function buildCompareTwoReviewsHref(args: {
  readonly baseRunId: string;
  readonly architectureId?: string;
}): string {
  const trimmed = args.baseRunId.trim();

  if (trimmed.length === 0) {
    const architectureId = args.architectureId?.trim() ?? "";

    if (architectureId.length > 0) {
      return compareTwoReviewsHref({ architectureId });
    }

    return COMPARE_TWO_REVIEWS_PATH;
  }

  const architectureId = args.architectureId?.trim() ?? "";

  return compareTwoReviewsHref({
    priorRunId: trimmed,
    ...(architectureId.length > 0 ? { architectureId } : {}),
  });
}

/** Extracts a review run id from a review-detail pathname when present. */
export function readReviewRunIdFromPathname(pathname: string): string | null {
  const pathOnly = pathname.trim().split("?")[0] ?? "";
  const match = /^\/architecture\/reviews\/([^/]+)/.exec(pathOnly);

  if (match === null) {
    return null;
  }

  const runId = decodeURIComponent(match[1] ?? "").trim();

  return runId.length > 0 ? runId : null;
}
