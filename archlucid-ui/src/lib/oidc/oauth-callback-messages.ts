/**
 * User-facing wording for OAuth2 authorize callback (?error=&error_description=)
 * — avoids leaking internals while staying accurate for admins.
 */

export function decodeOAuthErrorDescription(encoded: string | null | undefined): string {
  if (encoded === null || encoded === undefined) {
    return "";
  }

  const trimmed = encoded.trim();

  if (trimmed.length === 0) {
    return "";
  }

  try {
    return decodeURIComponent(trimmed.replace(/\+/g, " "));
  } catch {
    return trimmed.replace(/\+/g, " ");
  }
}

function formatErrorCodeForReading(errorCode: string): string {
  return errorCode.replace(/_/g, " ").trim();
}

/** Maps standard OAuth authorize errors to actionable copy for the SPA callback route. */
export function humanizeAuthorizeCallbackError(errorCode: string, decodedDescription: string): string {
  const normalized = errorCode.trim().toLowerCase();
  const detail = decodedDescription.trim();

  switch (normalized) {
    case "access_denied":
      return detail.length > 0
        ? `Sign-in stopped: ${detail}`
        : "You canceled sign-in or your organization declined access. Try again if that was unintentional.";
    case "login_required":
    case "interaction_required":
      return "Another sign-in step is required. Try signing in again and complete any prompts from your identity provider.";
    case "consent_required":
      return "Your organization requires administrator consent for this app. Contact IT, then try again.";
    case "invalid_request":
      return detail.length > 0
        ? `This sign-in request was not valid (${detail}). Try signing in again.`
        : "This sign-in request was not valid. Try signing in again.";
    case "unauthorized_client":
      return "This sign-in route is not enabled for your identity provider registration. Contact your ArchLucid account team.";
    case "invalid_scope":
      return "The requested permissions are not available on this tenant. Contact your ArchLucid account team.";
    case "server_error":
    case "temporarily_unavailable":
      return "Your identity provider reported a temporary error. Wait a minute and try signing in again.";
    default:
      if (detail.length > 0) {
        return `${formatErrorCodeForReading(normalized)}: ${detail}`;
      }

      return `Sign-in did not finish (${formatErrorCodeForReading(normalized)}). Try again, or contact support if this persists.`;
  }
}
