import {
  getOidcAuthority,
  getOidcClientId,
  getOidcPostLogoutRedirectUri,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import {
  LEGACY_OIDC_ACCESS_TOKEN_KEY,
  LEGACY_OIDC_CODE_VERIFIER_KEY,
  LEGACY_OIDC_EXPIRES_AT_MS_KEY,
  LEGACY_OIDC_ID_TOKEN_KEY,
  LEGACY_OIDC_NONCE_KEY,
  LEGACY_OIDC_OAUTH_STATE_KEY,
  LEGACY_OIDC_REFRESH_TOKEN_KEY,
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_CODE_VERIFIER_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_ID_TOKEN_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_REFRESH_TOKEN_KEY,
} from "@/lib/oidc/storage-keys";
import { decodeJwtPayload, pickDisplayNameFromPayload } from "@/lib/oidc/jwt-payload";
import { refreshAccessToken } from "@/lib/oidc/token-client";
import type { OidcTokenResponse } from "@/lib/oidc/token-client";

const EXPIRY_SKEW_MS = 60_000;

/** Prefer the ArchLucid key; if only the legacy ArchiForge-era key exists, copy forward and drop legacy. */
function readSessionMigrateForward(newKey: string, legacyKey: string): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const primary = sessionStorage.getItem(newKey);

  if (primary !== null && primary.length > 0) {
    return primary;
  }

  const legacy = sessionStorage.getItem(legacyKey);

  if (legacy === null || legacy.length === 0) {
    return null;
  }

  sessionStorage.setItem(newKey, legacy);
  sessionStorage.removeItem(legacyKey);

  return legacy;
}

function removeOidcKeyPair(newKey: string, legacyKey: string): void {
  sessionStorage.removeItem(newKey);
  sessionStorage.removeItem(legacyKey);
}

export function persistTokenResponse(tokens: OidcTokenResponse): void {
  sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, tokens.access_token);
  sessionStorage.removeItem(LEGACY_OIDC_ACCESS_TOKEN_KEY);

  if (tokens.refresh_token) {
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, tokens.refresh_token);
    sessionStorage.removeItem(LEGACY_OIDC_REFRESH_TOKEN_KEY);
  }

  if (tokens.id_token) {
    sessionStorage.setItem(OIDC_ID_TOKEN_KEY, tokens.id_token);
    sessionStorage.removeItem(LEGACY_OIDC_ID_TOKEN_KEY);
  }

  const expiresInSec = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  const expiresAtMs = Date.now() + expiresInSec * 1000;

  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(expiresAtMs));
  sessionStorage.removeItem(LEGACY_OIDC_EXPIRES_AT_MS_KEY);
}

export function clearOidcSession(): void {
  removeOidcKeyPair(OIDC_ACCESS_TOKEN_KEY, LEGACY_OIDC_ACCESS_TOKEN_KEY);
  removeOidcKeyPair(OIDC_REFRESH_TOKEN_KEY, LEGACY_OIDC_REFRESH_TOKEN_KEY);
  removeOidcKeyPair(OIDC_EXPIRES_AT_MS_KEY, LEGACY_OIDC_EXPIRES_AT_MS_KEY);
  removeOidcKeyPair(OIDC_ID_TOKEN_KEY, LEGACY_OIDC_ID_TOKEN_KEY);
  removeOidcKeyPair(OIDC_OAUTH_STATE_KEY, LEGACY_OIDC_OAUTH_STATE_KEY);
  removeOidcKeyPair(OIDC_CODE_VERIFIER_KEY, LEGACY_OIDC_CODE_VERIFIER_KEY);
  removeOidcKeyPair(OIDC_NONCE_KEY, LEGACY_OIDC_NONCE_KEY);
}

export function storePkceState(state: string, codeVerifier: string, nonce: string): void {
  sessionStorage.setItem(OIDC_OAUTH_STATE_KEY, state);
  sessionStorage.removeItem(LEGACY_OIDC_OAUTH_STATE_KEY);
  sessionStorage.setItem(OIDC_CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.removeItem(LEGACY_OIDC_CODE_VERIFIER_KEY);
  sessionStorage.setItem(OIDC_NONCE_KEY, nonce);
  sessionStorage.removeItem(LEGACY_OIDC_NONCE_KEY);
}

export function readPkceState(): { state: string; codeVerifier: string; nonce: string } | null {
  const state = readSessionMigrateForward(OIDC_OAUTH_STATE_KEY, LEGACY_OIDC_OAUTH_STATE_KEY);
  const codeVerifier = readSessionMigrateForward(OIDC_CODE_VERIFIER_KEY, LEGACY_OIDC_CODE_VERIFIER_KEY);
  const nonce = readSessionMigrateForward(OIDC_NONCE_KEY, LEGACY_OIDC_NONCE_KEY);

  if (!state || !codeVerifier || !nonce) {
    return null;
  }

  return { state, codeVerifier, nonce };
}

export function consumePkceState(): { state: string; codeVerifier: string; nonce: string } | null {
  const pair = readPkceState();

  if (!pair) {
    return null;
  }

  removeOidcKeyPair(OIDC_OAUTH_STATE_KEY, LEGACY_OIDC_OAUTH_STATE_KEY);
  removeOidcKeyPair(OIDC_CODE_VERIFIER_KEY, LEGACY_OIDC_CODE_VERIFIER_KEY);
  removeOidcKeyPair(OIDC_NONCE_KEY, LEGACY_OIDC_NONCE_KEY);

  return pair;
}

function getExpiresAtMs(): number {
  const raw =
    readSessionMigrateForward(OIDC_EXPIRES_AT_MS_KEY, LEGACY_OIDC_EXPIRES_AT_MS_KEY) ?? "0";

  return Number(raw);
}

/**
 * Access token for Authorization: Bearer (undefined if missing or past skewed expiry).
 */
export function getAccessTokenForApi(): string | undefined {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }

  const exp = getExpiresAtMs();

  if (Date.now() >= exp - EXPIRY_SKEW_MS) {
    return undefined;
  }

  const token = readSessionMigrateForward(OIDC_ACCESS_TOKEN_KEY, LEGACY_OIDC_ACCESS_TOKEN_KEY);

  return token && token.length > 0 ? token : undefined;
}

/**
 * Refreshes using refresh_token when within skew of expiry. No-op when not in browser JWT mode.
 */
export async function ensureAccessTokenFresh(): Promise<void> {
  if (typeof window === "undefined" || !isJwtAuthMode()) {
    return;
  }

  const exp = getExpiresAtMs();
  const refresh =
    readSessionMigrateForward(OIDC_REFRESH_TOKEN_KEY, LEGACY_OIDC_REFRESH_TOKEN_KEY) ?? "";
  const authority = getOidcAuthority();
  const clientId = getOidcClientId();

  if (!refresh || !authority || !clientId) {
    return;
  }

  if (Date.now() < exp - EXPIRY_SKEW_MS) {
    return;
  }

  try {
    const doc = await loadDiscoveryDocument(authority);
    const tokens = await refreshAccessToken({
      tokenEndpoint: doc.token_endpoint,
      clientId,
      refreshToken: refresh,
    });

    persistTokenResponse(tokens);
  } catch {
    clearOidcSession();
  }
}

export function readSignedInDisplayName(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const access = readSessionMigrateForward(OIDC_ACCESS_TOKEN_KEY, LEGACY_OIDC_ACCESS_TOKEN_KEY);
  const idTok = readSessionMigrateForward(OIDC_ID_TOKEN_KEY, LEGACY_OIDC_ID_TOKEN_KEY);

  if (access) {
    const fromAccess = pickDisplayNameFromPayload(decodeJwtPayload(access));

    if (fromAccess) {
      return fromAccess;
    }
  }

  if (idTok) {
    return pickDisplayNameFromPayload(decodeJwtPayload(idTok));
  }

  return null;
}

export function isLikelySignedIn(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  const token = readSessionMigrateForward(OIDC_ACCESS_TOKEN_KEY, LEGACY_OIDC_ACCESS_TOKEN_KEY);

  return Boolean(token && token.length > 0 && Date.now() < getExpiresAtMs() - EXPIRY_SKEW_MS);
}

/**
 * Clears local session and redirects to the IdP end_session endpoint when available (OIDC RP-initiated logout).
 */
export async function signOutAndRedirectHome(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const idToken =
    readSessionMigrateForward(OIDC_ID_TOKEN_KEY, LEGACY_OIDC_ID_TOKEN_KEY) ?? undefined;
  const authority = getOidcAuthority();

  clearOidcSession();

  if (!authority) {
    window.location.assign("/");

    return;
  }

  try {
    const doc = await loadDiscoveryDocument(authority);

    if (doc.end_session_endpoint && idToken && idToken.length > 0) {
      const url = new URL(doc.end_session_endpoint);

      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("post_logout_redirect_uri", getOidcPostLogoutRedirectUri());
      window.location.assign(url.toString());

      return;
    }
  } catch {
    /* ignore discovery errors */
  }

  window.location.assign("/");
}
