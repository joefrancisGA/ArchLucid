/** Canonical First review guide (left-nav label); formerly `/onboarding` (retired — no redirect). */
export const FIRST_REVIEW_GUIDE_PATH = "/architecture/first-review-guide" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_ONBOARDING_PATH = "/onboarding" as const;

export function isFirstReviewGuidePath(pathname: string): boolean {
  return pathname === FIRST_REVIEW_GUIDE_PATH || pathname.startsWith(`${FIRST_REVIEW_GUIDE_PATH}/`);
}
