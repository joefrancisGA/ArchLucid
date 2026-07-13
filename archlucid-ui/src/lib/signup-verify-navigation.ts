export const SIGNUP_VERIFY_ONBOARDING_PATH = "/onboarding?source=registration";

export function buildSignupVerifySignInHref(): string {
  return `/auth/signin?returnUrl=${encodeURIComponent(SIGNUP_VERIFY_ONBOARDING_PATH)}`;
}
