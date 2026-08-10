import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

/** Legacy bookmark path — redirect shim via `buildOnboardingRedirectPath` when a page exists. */
export const LEGACY_ONBOARDING_START_PATH = "/onboarding/start";

/** Canonical First review guide tracked on traffic row ARF. */
export const CANONICAL_ONBOARDING_PATH = FIRST_REVIEW_GUIDE_PATH;
