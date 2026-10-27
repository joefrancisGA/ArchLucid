import { isSafeOidcEndpointUrl } from "@/lib/oidc/discovery";
import {
  humanizeAuthorizeCallbackError,
  isReadableOAuthErrorCode,
  normalizeAuthorizeCallbackErrorCode,
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

/** Token-endpoint OAuth failure with normalized `error` code for server-side session policy. */
export class OAuthTokenEndpointError extends Error {
  readonly normalizedErrorCode: string;

  constructor(message: string, normalizedErrorCode: string) {
    super(message);
    this.name = "OAuthTokenEndpointError";
    this.normalizedErrorCode = normalizedErrorCode;
  }
}

/** OAuth error codes that share fixed authorize-callback operator copy when description is absent. */
function shouldHumanizeTokenOAuthErrorCode(normalizedErrorCode: string): boolean {
  switch (normalizedErrorCode) {
    case "access_denied":
    case "login_required":
    case "interaction_required":
    case "consent_required":
    case "invalid_client":
    case "invalid_grant":
    case "invalid_token":
    case "expired_token":
    case "invalid_request":
    case "redirect_uri_mismatch":
    case "unauthorized_client":
    case "unsupported_grant_type":
    case "unsupported_response_type":
    case "unsupported_token_type":
    case "insufficient_scope":
    case "invalid_scope":
    case "server_error":
    case "temporarily_unavailable":
    case "authorization_pending":
    case "slow_down":
      return true;
    default:
      return false;
  }
}

const OAUTH_TRANSIENT_TOKEN_ERROR_CODES = new Set([
  "server_error",
  "temporarily_unavailable",
  // RFC 8628 device authorization grant — polling/backoff, not refresh-token revocation.
  "authorization_pending",
  "slow_down",
]);

function shouldClearBffSessionForOAuthTokenErrorCode(normalizedErrorCode: string): boolean {
  if (OAUTH_TRANSIENT_TOKEN_ERROR_CODES.has(normalizedErrorCode)) {
    return false;
  }

  if (shouldHumanizeTokenOAuthErrorCode(normalizedErrorCode)) {
    return true;
  }

  return isReadableOAuthErrorCode(normalizedErrorCode);
}

/**
 * True when the IdP rejected a refresh-token grant and the BFF session should be cleared.
 * Humanized operator copy no longer embeds snake_case codes in `Error.message`.
 */
export function isOAuthRefreshTokenRejectedError(error: unknown): boolean {
  if (error instanceof OAuthTokenEndpointError) {
    return shouldClearBffSessionForOAuthTokenErrorCode(error.normalizedErrorCode);
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const snakeCaseOAuthTokens = message.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g);

  if (snakeCaseOAuthTokens) {
    for (const token of snakeCaseOAuthTokens) {
      if (shouldClearBffSessionForOAuthTokenErrorCode(token)) {
        return true;
      }
    }
  }

  return false;
}

function readOAuthErrorString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = normalizeOAuthErrorCode(normalizeAuthorizeCallbackErrorCode(value));

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
    if (rawErrorCode.length > 0) {
      return new OAuthTokenEndpointError(
        "We did not receive a complete response from your identity provider. Start sign-in again.",
        "invalid_request",
      );
    }

    return null;
  }

  if (errorCode.length === 0) {
    return new OAuthTokenEndpointError(
      sanitizeOAuthUserFacingMessage(errorDescription),
      "invalid_request",
    );
  }

  if (shouldHumanizeTokenOAuthErrorCode(errorCode)) {
    return new OAuthTokenEndpointError(
      humanizeAuthorizeCallbackError(rawErrorCode, errorDescription),
      errorCode,
    );
  }

  const msg = [errorCode, errorDescription].filter((part) => part.length > 0).join(": ");

  return new OAuthTokenEndpointError(sanitizeOAuthUserFacingMessage(msg), errorCode);
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
  // Soft hyphens, variation selectors, and Unicode replacement glyphs are copy/paste artifacts, not bearer token material.
  return stripOAuthInvisibleFormatChars(
    value.replace(/[\u00AD\uFE00-\uFE0F\uFFFC\uFFFD]/gu, "").trim(),
  ).trim();
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
