/**
 * Canonical customer-facing authentication terminology (passwordless email-code + work/school SSO).
 * Import here instead of scattering auth marketing copy across routes.
 */

/** When both sign-in methods are shown on one screen. */
export const CUSTOMER_AUTH_DUAL_METHOD_LEAD =
  "Architect plan and other individual accounts sign in with a work account or a one-time code sent to any email address. Company SSO applies only when your organization has configured it.";

/** Short orientation under the method buttons for non-SSO audiences. */
export const CUSTOMER_AUTH_NON_SSO_ORIENTATION =
  "If your organization uses company SSO, choose work or school account — or enter your work email for an email code and ArchLucid will route you when SSO is required.";

export const CUSTOMER_AUTH_WORK_SCHOOL_ACTION = "Continue with work or school account";

export const CUSTOMER_AUTH_EMAIL_CODE_ACTION = "Continue with email code";

/** Guided workspace / evaluation onboarding — not the public illustrative sample. */
export const CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN =
  "Sign in with a supported identity or verify your email with a one-time code.";

/** Public illustrative sample pages and marketing sample path. */
export const CUSTOMER_AUTH_PUBLIC_SAMPLE_NO_SIGN_IN = "No sign-in required";

export const CUSTOMER_AUTH_ENTERPRISE_SSO_EXPLANATION =
  "Organizations can configure SAML or OpenID Connect and require members of verified domains to use the organization's identity provider.";

export const CUSTOMER_AUTH_ENTERPRISE_SSO_ENFORCEMENT_NOTE =
  "When your organization enforces SSO for a verified email domain, members must sign in through that identity provider. Email-code sign-in is not available as a routine bypass.";

export const CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD =
  "Create an evaluation workspace with sample architecture review data, then sign in with a work or school account or a one-time email code when you return.";

/** Lowercase fragments that must not appear in buyer-facing auth copy. */
export const CUSTOMER_AUTH_BANNED_PHRASES: readonly string[] = [
  "sign in with your work identity",
  "work or school account required",
  "no separate account to create",
  "microsoft entra id or google workspace only",
  "microsoft entra id or a google workspace account",
  "anyone can start",
  "create a password",
  "work sign-in required",
  "corporate sign-in required",
  "only enterprise identities",
  "only work accounts",
  "bypass enforced sso",
  "bypass sso",
  "disable sso",
] as const;

export function findCustomerAuthBannedPhrases(corpus: string): string[] {
  const normalized = corpus.toLowerCase();

  return CUSTOMER_AUTH_BANNED_PHRASES.filter((phrase) => normalized.includes(phrase));
}
