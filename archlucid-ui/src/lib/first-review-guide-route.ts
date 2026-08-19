/** Canonical First review guide (left-nav label); formerly `/onboarding` (retired — no redirect). */
export const FIRST_REVIEW_GUIDE_PATH = "/architecture/first-review-guide" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_ONBOARDING_PATH = "/onboarding" as const;

/** Deep-link anchor for optional workspace setup (command palette, finish-setup CTAs). */
export const ONBOARDING_OPTIONAL_SETUP_HEADING_ID = "onboarding-optional-setup-heading" as const;

/** Walkthrough / checklist progress block on the first-review-guide surface. */
export const FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID = "first-review-guide-progress-heading" as const;

/** Legacy FinishSetupWizardPanel section anchor — maps to optional workspace setup. */
export const LEGACY_FINISH_SETUP_SECTION_ID = "finish-setup" as const;

/** Legacy FinishSetupWizardPanel title anchor — maps to optional workspace setup. */
export const LEGACY_FINISH_SETUP_HEADING_ID = "finish-setup-heading" as const;

/** Non-admin delegation variant on the same first-review-guide surface. */
export const ONBOARDING_OPTIONAL_SETUP_DELEGATION_HEADING_ID =
  "onboarding-optional-setup-delegation-heading" as const;

export function isFirstReviewGuidePath(pathname: string): boolean {
  return pathname === FIRST_REVIEW_GUIDE_PATH || pathname.startsWith(`${FIRST_REVIEW_GUIDE_PATH}/`);
}

export function normalizeLocationHashId(hash: string): string {
  return hash.replace(/^#/, "").trim();
}

/** True when the URL targets optional workspace setup (Cmd+K finish-setup, shared CTAs). */
export function isOnboardingOptionalSetupDeepLinkHash(hash: string): boolean {
  const hashId = normalizeLocationHashId(hash);

  return (
    hashId === ONBOARDING_OPTIONAL_SETUP_HEADING_ID ||
    hashId === LEGACY_FINISH_SETUP_SECTION_ID ||
    hashId === LEGACY_FINISH_SETUP_HEADING_ID
  );
}

/** True when the URL targets the first-review walkthrough progress checklist. */
export function isFirstReviewGuideProgressDeepLinkHash(hash: string): boolean {
  return normalizeLocationHashId(hash) === FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID;
}
