/**
 * User-facing copy when interactive OIDC/JWT sign-in is not configured.
 * Never include environment variable names or internal mode strings.
 */
export const BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE =
  "Sign-in is available to approved private-beta participants. Contact your ArchLucid account team to request access.";

/** Substrings that must never appear in customer-visible auth/signup/callback copy. */
export const BUYER_SAFE_AUTH_FORBIDDEN_SUBSTRINGS = [
  "Exception",
  "StackTrace",
  "at ArchLucid.",
  "SqlException",
  "INNER JOIN",
  "DevelopmentBypass",
  "HashPepper",
  "BotChallenge:Secret",
  "client_secret",
  "refresh_token",
  "id_token",
  "SAMLResponse",
  "Assertion",
] as const;

export function containsBuyerUnsafeAuthLeak(text: string | null | undefined): boolean {
  if (text == null || text.trim().length === 0) {
    return false;
  }

  const haystack = text.toLowerCase();

  for (const snippet of BUYER_SAFE_AUTH_FORBIDDEN_SUBSTRINGS) {
    if (haystack.includes(snippet.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/** Map unknown/unsafe provider errors to a generic recovery message. */
export function toBuyerSafeAuthFailureMessage(
  raw: string | null | undefined,
  fallback = "Sign-in could not be completed. Try again, or contact your ArchLucid administrator.",
): string {
  if (raw == null || raw.trim().length === 0) {
    return fallback;
  }

  if (containsBuyerUnsafeAuthLeak(raw)) {
    return fallback;
  }

  return raw.trim();
}
