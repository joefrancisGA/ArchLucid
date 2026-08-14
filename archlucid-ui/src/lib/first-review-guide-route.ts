/** Canonical First review guide (left-nav label); formerly `/onboarding` (retired — no redirect). */
export const FIRST_REVIEW_GUIDE_PATH = "/architecture/first-review-guide" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_ONBOARDING_PATH = "/onboarding" as const;

/** Deep-link anchor for optional workspace setup (command palette, finish-setup CTAs). */
export const ONBOARDING_OPTIONAL_SETUP_HEADING_ID = "onboarding-optional-setup-heading" as const;

/** Non-admin delegation variant on the same first-review-guide surface. */
export const ONBOARDING_OPTIONAL_SETUP_DELEGATION_HEADING_ID =
  "onboarding-optional-setup-delegation-heading" as const;

export function isFirstReviewGuidePath(pathname: string): boolean {
  return pathname === FIRST_REVIEW_GUIDE_PATH || pathname.startsWith(`${FIRST_REVIEW_GUIDE_PATH}/`);
}
