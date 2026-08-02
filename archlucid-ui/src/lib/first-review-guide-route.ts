/** Canonical First review guide (left-nav label); formerly `/onboarding`. */
export const FIRST_REVIEW_GUIDE_PATH = "/architecture/first-review-guide" as const;

/** Legacy bookmark path — `next.config` permanent redirect to {@link FIRST_REVIEW_GUIDE_PATH}. */
export const LEGACY_ONBOARDING_PATH = "/onboarding" as const;

export function isFirstReviewGuidePath(pathname: string): boolean {
  return pathname === FIRST_REVIEW_GUIDE_PATH || pathname.startsWith(`${FIRST_REVIEW_GUIDE_PATH}/`);
}
