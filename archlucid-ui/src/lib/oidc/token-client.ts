import { isSafeOidcEndpointUrl } from "@/lib/oidc/discovery";
import {
  humanizeAuthorizeCallbackError,
  isReadableOAuthErrorCode,
  normalizeOAuthErrorCode,
  readOAuthJsonErrorDescription,
  sanitizeOAuthUserFacingMessage,
  stripOAuthInvisibleFormatChars,
} from "@/lib/oidc/oauth-callback-messages";
import { resolveExpiresInSeconds } from "@/lib/oidc/resolve-expires-in-seconds";

export type OidcTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

/** OAuth error codes that share fixed authorize-callback operator copy when description is absent. */
function shouldHumanizeTokenOAuthErrorCode(normalizedErrorCode: string): boolean {
  switch (normalizedErrorCode) {
    case "access_denied":
    case "login_required":
    case "interaction_required":
    case "consent_required":
    case "invalid_client":
    case "invalid_grant":
    case "invalid_request":
    case "redirect_uri_mismatch":
    case "unauthorized_client":
    case "invalid_scope":
    case "server_error":
    case "temporarily_unavailable":
      return true;
    default:
      return false;
  }
}

function readOAuthErrorString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = normalizeOAuthErrorCode(value);

  if (normalized.length === 0 || !isReadableOAuthErrorCode(normalized)) {
    return "";
  }

  return normalized;
}

function errorFromOAuthJson(json: unknown): Error | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const record = json as { error?: unknown; error_description?: unknown };
  const rawErrorCode = typeof record.error === "string" ? record.error : "";
  const errorCode = readOAuthErrorString(record.error);
  const errorDescription =
    typeof record.error_description === "string"
      ? readOAuthJsonErrorDescription(record.error_description)
      : "";

  if (errorCode.length === 0 && errorDescription.length === 0) {
    return null;
  }

  if (errorCode.length === 0) {
    return new Error(sanitizeOAuthUserFacingMessage(errorDescription));
  }

  if (shouldHumanizeTokenOAuthErrorCode(errorCode)) {
    return new Error(humanizeAuthorizeCallbackError(rawErrorCode, errorDescription));
  }

  const msg = [errorCode, errorDescription].filter((part) => part.length > 0).join(": ");

  return new Error(sanitizeOAuthUserFacingMessage(msg));
}

async function readOAuthError(res: Response, bodyText: string): Promise<Error> {
  try {
    const json = JSON.parse(bodyText) as unknown;
    const oauthError = errorFromOAuthJson(json);

    if (oauthError) {
      return oauthError;
    }
  } catch {
    /* fall through */
  }

  // Do not echo proxy/HTML error pages — callback surfaces `Error.message` to operators.
  return new Error(`Token endpoint error ${res.status}`);
}

function trimTokenFormParams(params: Record<string, string>): Record<string, string> {
  const trimmed: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    trimmed[key] = normalizeTokenString(value);
  }

  return trimmed;
}

async function postTokenForm(
  tokenEndpoint: string,
  params: Record<string, string>,
): Promise<OidcTokenResponse> {
  if (!isSafeOidcEndpointUrl(tokenEndpoint)) {
    throw new Error("Invalid token endpoint URL");
  }

  const body = new URLSearchParams(trimTokenFormParams(params));
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw await readOAuthError(response, text);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Token response was not valid JSON");
  }

  const oauthError = errorFromOAuthJson(parsed);

  if (oauthError) {
    throw oauthError;
  }

  return parseOidcTokenResponse(parsed);
}

function normalizeTokenString(value: string): string {
  return stripOAuthInvisibleFormatChars(value.trim()).trim();
}

function normalizeOptionalTokenString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeTokenString(value);

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

function parseOidcTokenResponse(parsed: unknown): OidcTokenResponse {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Token response missing access_token");
  }

  const record = parsed as Record<string, unknown>;
  const accessTokenRaw = record.access_token;

  if (typeof accessTokenRaw !== "string") {
    throw new Error("Token response missing access_token");
  }

  const accessToken = normalizeTokenString(accessTokenRaw);

  if (accessToken.length === 0) {
    throw new Error("Token response missing access_token");
  }

  const refreshToken = normalizeOptionalTokenString(record.refresh_token);
  const idToken = normalizeOptionalTokenString(record.id_token);
  const expiresIn = resolveExpiresInSeconds(record.expires_in as number | undefined);

  return {
    ...(parsed as OidcTokenResponse),
    access_token: accessToken,
    refresh_token: refreshToken,
    id_token: idToken,
    expires_in: expiresIn,
  };
}

export function shouldMarkAuthorizeCallbackFailedOnExchangeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  // Misconfigured discovery/token URL — not an IdP OAuth outcome worth preserving return-path retry state.
  return error.message !== "Invalid token endpoint URL";
}

export async function exchangeAuthorizationCode(params: {
  tokenEndpoint: string;
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<OidcTokenResponse> {
  try {
    return await postTokenForm(params.tokenEndpoint, {
      grant_type: "authorization_code",
      client_id: params.clientId,
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    });
  } catch (error) {
    if (shouldMarkAuthorizeCallbackFailedOnExchangeError(error)) {
      // Re-mark so a follow-up initiateOidcRedirect keeps the stored post-sign-in return path
      // when token exchange fails after the authorize redirect.
      const { markAuthorizeCallbackFailed } = await import("@/lib/oidc/session");

      markAuthorizeCallbackFailed();
    }

    throw error;
  }
}

export async function refreshAccessToken(params: {
  tokenEndpoint: string;
  clientId: string;
  refreshToken: string;
}): Promise<OidcTokenResponse> {
  return postTokenForm(params.tokenEndpoint, {
    grant_type: "refresh_token",
    client_id: params.clientId,
    refresh_token: params.refreshToken,
  });
}
