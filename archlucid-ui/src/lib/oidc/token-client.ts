import { isSafeOidcEndpointUrl } from "@/lib/oidc/discovery";
import {
  humanizeAuthorizeCallbackError,
  isObjectCoercionOAuthErrorValue,
  isPlaceholderOAuthErrorCodeLiteral,
  isReadableOAuthErrorCode,
  isUsableOAuthErrorUriValue,
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
function isAllowedNumericOAuthErrorMetadataWithAccessToken(error: unknown): boolean {
  return (
    typeof error === "number" &&
    Number.isFinite(error) &&
    Number.isInteger(error) &&
    error >= 400 &&
    error <= 599
  );
}

function parseOAuthErrorMetadataInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^[+-]?\d+$/u.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
}

function oauthErrorStringIndicatesMalformedNumericMetadata(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0 || /^[+-]?\d+$/u.test(trimmed)) {
    return false;
  }

  if (/[eE]/u.test(trimmed) && Number.isFinite(Number(trimmed))) {
    return true;
  }

  const collapsed = trimmed.toLowerCase();

  if (collapsed === "infinity" || collapsed === "-infinity" || collapsed === "nan") {
    return true;
  }

  return Number.isFinite(Number(trimmed));
}

function oauthNumericErrorMetadataWithUsableTokenIndicatesFailure(
  record: Record<string, unknown>,
): boolean {
  if (!Object.hasOwn(record, "error")) {
    return false;
  }

  if (
    typeof record.error === "number" &&
    (!Number.isFinite(record.error) || !Number.isInteger(record.error))
  ) {
    return true;
  }

  if (typeof record.error === "string" && oauthErrorStringIndicatesMalformedNumericMetadata(record.error)) {
    return true;
  }

  const numericMetadata = parseOAuthErrorMetadataInteger(record.error);

  if (numericMetadata === null) {
    return false;
  }

  if (!isAllowedNumericOAuthErrorMetadataWithAccessToken(numericMetadata)) {
    return true;
  }

  return hasPresentReadableOAuthJsonErrorDescription(record);
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

function readRawOAuthJsonField(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "";
}

function isExplicitNullOAuthJsonField(value: unknown): boolean {
  return value === null;
}

function incompleteIdpOAuthTokenEndpointError(): OAuthTokenEndpointError {
  return new OAuthTokenEndpointError(
    "We did not receive a complete response from your identity provider. Start sign-in again.",
    "invalid_request",
  );
}

function isPresentButEmptyOAuthJsonStringField(value: unknown): boolean {
  return typeof value === "string" && value.length === 0;
}

function hasUsableOAuthJsonErrorUriField(record: Record<string, unknown>): boolean {
  if (!Object.hasOwn(record, "error_uri")) {
    return false;
  }

  return isUsableOAuthErrorUriValue(record.error_uri);
}

function isNonStringOAuthJsonField(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

function jsonObjectMissingOAuthErrorFields(json: Record<string, unknown>): boolean {
  return !Object.hasOwn(json, "error") && !Object.hasOwn(json, "error_description");
}

function hasPresentReadableOAuthJsonErrorDescription(record: Record<string, unknown>): boolean {
  if (!Object.hasOwn(record, "error_description")) {
    return false;
  }

  if (typeof record.error_description !== "string") {
    return true;
  }

  const rawDescription = record.error_description;

  if (rawDescription.trim().length === 0) {
    return false;
  }

  return (
    readOAuthJsonErrorDescription(rawDescription).length > 0 || rawDescription.trim().length > 0
  );
}

function hasReadableOAuthJsonErrorDescriptionWithoutUsableUri(record: Record<string, unknown>): boolean {
  if (hasUsableOAuthJsonErrorUriField(record)) {
    return false;
  }

  if (!Object.hasOwn(record, "error_description")) {
    return false;
  }

  if (typeof record.error_description !== "string") {
    return true;
  }

  const rawDescription = record.error_description;

  if (rawDescription.trim().length === 0) {
    return true;
  }

  return (
    readOAuthJsonErrorDescription(rawDescription).length > 0 || rawDescription.trim().length > 0
  );
}

function hollowOAuthJsonErrorIndicatesFailureWithUsableToken(record: Record<string, unknown>): boolean {
  if (hasUsableOAuthJsonErrorUriField(record)) {
    return !hasPresentReadableOAuthJsonErrorDescription(record);
  }

  return hasReadableOAuthJsonErrorDescriptionWithoutUsableUri(record);
}

function oauthTokenJsonIndicatesErrorResponse(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") {
    return false;
  }

  const record = parsed as Record<string, unknown>;

  const accessTokenRaw = record.access_token;
  const hasUsableAccessToken =
    typeof accessTokenRaw === "string" && normalizeTokenString(accessTokenRaw).length > 0;

  if (Object.hasOwn(record, "error")) {
    if (!hasUsableAccessToken) {
      return true;
    }

    if (typeof record.error === "string" && isObjectCoercionOAuthErrorValue(record.error)) {
      return true;
    }

    if (typeof record.error === "boolean") {
      return true;
    }

    if (isNonStringOAuthJsonField(record.error)) {
      return true;
    }

    const numericMetadataFailure = oauthNumericErrorMetadataWithUsableTokenIndicatesFailure(record);

    if (numericMetadataFailure) {
      return true;
    }

    if (parseOAuthErrorMetadataInteger(record.error) !== null) {
      return false;
    }

    if (isExplicitNullOAuthJsonField(record.error) || isPresentButEmptyOAuthJsonStringField(record.error)) {
      return hollowOAuthJsonErrorIndicatesFailureWithUsableToken(record);
    }

    let errorCode = readOAuthErrorString(record.error);

    if (isPlaceholderOAuthErrorCodeLiteral(errorCode)) {
      errorCode = "";
    }

    if (shouldHumanizeTokenOAuthErrorCode(errorCode)) {
      return true;
    }

    if (errorCode.length === 0 && hasReadableOAuthJsonErrorDescriptionWithoutUsableUri(record)) {
      return true;
    }

    return false;
  }

  if (hasUsableAccessToken) {
    if (!Object.hasOwn(record, "error")) {
      if (hasReadableOAuthJsonErrorDescriptionWithoutUsableUri(record)) {
        return true;
      }

      if (hasUsableOAuthJsonErrorUriField(record)) {
        return true;
      }
    }

    return false;
  }

  return Object.hasOwn(record, "error_description") || Object.hasOwn(record, "error_uri");
}

function errorFromOAuthJson(json: unknown): Error | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const record = json as { error?: unknown; error_description?: unknown; error_uri?: unknown };

  if (
    isNonStringOAuthJsonField(record.error) ||
    isNonStringOAuthJsonField(record.error_description)
  ) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  if (typeof record.error === "boolean") {
    return incompleteIdpOAuthTokenEndpointError();
  }

  if (
    typeof record.error === "number" &&
    (!Number.isFinite(record.error) || !Number.isInteger(record.error))
  ) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  if (typeof record.error === "string" && oauthErrorStringIndicatesMalformedNumericMetadata(record.error)) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  const numericMetadata = parseOAuthErrorMetadataInteger(record.error);

  if (numericMetadata !== null && !isAllowedNumericOAuthErrorMetadataWithAccessToken(numericMetadata)) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  if (typeof record.error === "string" && isObjectCoercionOAuthErrorValue(record.error)) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  const rawErrorCode = readRawOAuthJsonField(record.error);
  const rawErrorDescription = readRawOAuthJsonField(record.error_description);
  let errorCode = readOAuthErrorString(record.error);

  if (isPlaceholderOAuthErrorCodeLiteral(errorCode)) {
    errorCode = "";
  }

  const errorDescription =
    typeof record.error_description === "string"
      ? readOAuthJsonErrorDescription(record.error_description)
      : "";

  if (errorCode.length === 0 && errorDescription.length === 0) {
    if (
      rawErrorCode.length > 0 ||
      rawErrorDescription.length > 0 ||
      isPresentButEmptyOAuthJsonStringField(record.error) ||
      isPresentButEmptyOAuthJsonStringField(record.error_description) ||
      isExplicitNullOAuthJsonField(record.error) ||
      isExplicitNullOAuthJsonField(record.error_description)
    ) {
      return incompleteIdpOAuthTokenEndpointError();
    }

    if (Object.hasOwn(record, "error_uri")) {
      return incompleteIdpOAuthTokenEndpointError();
    }

    return null;
  }

  if (errorCode.length === 0) {
    if (errorDescription.length > 0) {
      if (Object.hasOwn(record, "error") || Object.hasOwn(record, "error_uri")) {
        return incompleteIdpOAuthTokenEndpointError();
      }

      if (isPlaceholderOAuthErrorCodeLiteral(errorDescription.trim().toLowerCase())) {
        return incompleteIdpOAuthTokenEndpointError();
      }

      return new OAuthTokenEndpointError(
        sanitizeOAuthUserFacingMessage(errorDescription),
        "invalid_request",
      );
    }
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
  if (bodyText.trim().length === 0) {
    return incompleteIdpOAuthTokenEndpointError();
  }

  try {
    const json = JSON.parse(bodyText) as unknown;

    if (json === null || typeof json !== "object") {
      return incompleteIdpOAuthTokenEndpointError();
    }

    if (Array.isArray(json) || Object.keys(json).length === 0) {
      return incompleteIdpOAuthTokenEndpointError();
    }

    if (jsonObjectMissingOAuthErrorFields(json as Record<string, unknown>)) {
      return incompleteIdpOAuthTokenEndpointError();
    }

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

  const oauthError = oauthTokenJsonIndicatesErrorResponse(parsed) ? errorFromOAuthJson(parsed) : null;

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
