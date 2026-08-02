import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

export const SIGNUP_VERIFY_ONBOARDING_PATH = `${FIRST_REVIEW_GUIDE_PATH}?source=registration`;

export function buildSignupVerifySignInHref(): string {
  return `/auth/signin?returnUrl=${encodeURIComponent(SIGNUP_VERIFY_ONBOARDING_PATH)}`;
}
