import { isApiRequestError } from "@/lib/api-request-error";
import { sanitizeOperatorFacingText } from "@/lib/api-validation-problem";
import { containsBuyerUnsafeAuthLeak } from "@/lib/buyer/buyer-safe-auth-messages";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE =
  "Could not complete Atlassian consent. Try Connect with Atlassian again from Jira integration settings.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED =
  "Atlassian consent was denied or interrupted. Try Connect with Atlassian again when you are ready.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE =
  "Atlassian did not return a complete authorization response. Try Connect with Atlassian again.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED =
  "Consent succeeded but the refresh token could not be stored. Check secret storage configuration with your platform administrator.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL = "Try Connect with Atlassian again";

/** Raw exception substrings that must never appear in operator-facing OAuth callback copy (TB-1784). */
export const ITSM_ATLASSIAN_OAUTH_CALLBACK_FORBIDDEN_SUBSTRINGS = [
  "ArchLucid.",
  "SqlException",
  "StackTrace",
  "INNER JOIN",
  "client_secret",
  "refresh_token",
  "id_token",
  "System.",
  "NullReference",
] as const;

function containsForbiddenOAuthCallbackLeak(text: string): boolean {
  if (containsBuyerUnsafeAuthLeak(text)) {
    return true;
  }

  const haystack = text.toLowerCase();

  for (const snippet of ITSM_ATLASSIAN_OAUTH_CALLBACK_FORBIDDEN_SUBSTRINGS) {
    if (haystack.includes(snippet.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function toOperatorSafeOAuthCallbackMessage(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (raw === null || raw === undefined || raw.trim().length === 0) {
    return fallback;
  }

  const sanitized = sanitizeOperatorFacingText(raw.trim());

  if (sanitized.length === 0 || containsForbiddenOAuthCallbackLeak(sanitized)) {
    return fallback;
  }

  return sanitized;
}

export function mapItsmAtlassianOAuthIdpError(
  errorCode: string | null,
  description: string | null,
): string {
  const sanitizedDescription = description === null ? "" : sanitizeOperatorFacingText(description.trim());

  if (sanitizedDescription.length > 0 && !containsForbiddenOAuthCallbackLeak(sanitizedDescription)) {
    return sanitizedDescription;
  }

  if (errorCode?.toLowerCase() === "access_denied") {
    return ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED;
  }

  return ITSM_ATLASSIAN_OAUTH_CALLBACK_IDP_DENIED;
}

export function mapItsmAtlassianOAuthCallbackFailure(error: unknown): string {
  if (isApiRequestError(error)) {
    return toOperatorSafeOAuthCallbackMessage(error.message, ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE);
  }

  if (error instanceof Error) {
    return toOperatorSafeOAuthCallbackMessage(error.message, ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE);
  }

  return ITSM_ATLASSIAN_OAUTH_CALLBACK_GENERIC_FAILURE;
}
