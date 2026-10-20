import { isSafeOidcEndpointUrl } from "@/lib/oidc/discovery";
import {
  collapseOAuthErrorDescriptionLineBreaks,
  isReadableOAuthErrorCode,
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

function readOAuthErrorString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const collapsed = collapseOAuthErrorDescriptionLineBreaks(value.trim());
  const normalized = collapsed.replace(/\s+/gu, "_").trim();

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
  const errorCode = readOAuthErrorString(record.error);
  const errorDescription =
    typeof record.error_description === "string"
      ? readOAuthJsonErrorDescription(record.error_description)
      : "";
  const msg = [errorCode, errorDescription].filter((part) => part.length > 0).join(": ");

  if (!msg) {
    return null;
  }

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

export async function exchangeAuthorizationCode(params: {
  tokenEndpoint: string;
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<OidcTokenResponse> {
  return postTokenForm(params.tokenEndpoint, {
    grant_type: "authorization_code",
    client_id: params.clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
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
