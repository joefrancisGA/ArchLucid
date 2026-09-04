import { clearCachedColorModePreference } from "@/lib/color-mode-preference";
import { clearOperatorScopeStorage } from "@/lib/operator/operator-scope-storage";
import {
  getOidcAuthority,
  getOidcClientId,
  getOidcPostLogoutRedirectUri,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_CODE_VERIFIER_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_GOOGLE_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_NONCE_KEY,
  OIDC_GOOGLE_OAUTH_STATE_KEY,
  OIDC_ID_TOKEN_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  OIDC_REFRESH_TOKEN_KEY,
} from "@/lib/oidc/storage-keys";
import { decodeJwtPayload, pickDisplayNameFromPayload } from "@/lib/oidc/jwt-payload";
import { refreshAccessToken } from "@/lib/oidc/token-client";
import type { OidcTokenResponse } from "@/lib/oidc/token-client";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

export type OidcPkceFlow = "primary" | "google";

type StoredPkceState = {
  state: string;
  codeVerifier: string;
  nonce: string;
  flow: OidcPkceFlow;
};

const EXPIRY_SKEW_MS = 60_000;

function resolveExpiresInSeconds(expiresIn: number | undefined): number {
  const defaultExpiresInSec = 3600;

  if (expiresIn === undefined) {
    return defaultExpiresInSec;
  }

  const numericExpiresIn = Number(expiresIn);

  if (!Number.isFinite(numericExpiresIn)) {
    return defaultExpiresInSec;
  }

  if (numericExpiresIn === 0) {
    return 0;
  }

  if (numericExpiresIn < 0) {
    return defaultExpiresInSec;
  }

  return numericExpiresIn;
}

function shouldClearOidcSessionOnRefreshFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  ) {
    return false;
  }

  if (/token endpoint error (5\d{2}|408)\b/.test(message)) {
    return false;
  }

  return (
    message.includes("invalid_grant") ||
    message.includes("invalid_token") ||
    message.includes("token endpoint error 400") ||
    message.includes("token endpoint error 401") ||
    message.includes("token endpoint error 403")
  );
}

let refreshInFlight: Promise<void> | null = null;
let refreshSessionGeneration = 0;

function readSessionKey(key: string): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const value = sessionStorage.getItem(key);

  if (value === null || value.length === 0) {
    return null;
  }

  return value;
}

function removeOidcKeys(keys: readonly string[]): void {
  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

export function persistTokenResponse(tokens: OidcTokenResponse): void {
  if (typeof tokens.access_token !== "string" || tokens.access_token.trim().length === 0) {
    throw new Error("OIDC token response missing access_token");
  }

  sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, tokens.access_token);

  if (tokens.refresh_token) {
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  if (tokens.id_token) {
    sessionStorage.setItem(OIDC_ID_TOKEN_KEY, tokens.id_token);
  }

  const expiresInSec = resolveExpiresInSeconds(tokens.expires_in);
  const expiresAtMs = Date.now() + expiresInSec * 1000;

  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(expiresAtMs));
}

export function clearOidcSession(): void {
  refreshSessionGeneration += 1;
  refreshInFlight = null;
  removeOidcKeys([
    OIDC_ACCESS_TOKEN_KEY,
    OIDC_REFRESH_TOKEN_KEY,
    OIDC_EXPIRES_AT_MS_KEY,
    OIDC_ID_TOKEN_KEY,
    OIDC_OAUTH_STATE_KEY,
    OIDC_CODE_VERIFIER_KEY,
    OIDC_NONCE_KEY,
    OIDC_GOOGLE_OAUTH_STATE_KEY,
    OIDC_GOOGLE_CODE_VERIFIER_KEY,
    OIDC_GOOGLE_NONCE_KEY,
    OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  ]);
  clearCachedColorModePreference();
}

function pkceStorageKeys(flow: OidcPkceFlow): {
  stateKey: string;
  codeVerifierKey: string;
  nonceKey: string;
} {
  if (flow === "google") {
    return {
      stateKey: OIDC_GOOGLE_OAUTH_STATE_KEY,
      codeVerifierKey: OIDC_GOOGLE_CODE_VERIFIER_KEY,
      nonceKey: OIDC_GOOGLE_NONCE_KEY,
    };
  }

  return {
    stateKey: OIDC_OAUTH_STATE_KEY,
    codeVerifierKey: OIDC_CODE_VERIFIER_KEY,
    nonceKey: OIDC_NONCE_KEY,
  };
}

function readPkceStateForFlow(flow: OidcPkceFlow): Omit<StoredPkceState, "flow"> | null {
  const keys = pkceStorageKeys(flow);
  const state = readSessionKey(keys.stateKey);
  const codeVerifier = readSessionKey(keys.codeVerifierKey);
  const nonce = readSessionKey(keys.nonceKey);

  if (!state || !codeVerifier || !nonce) {
    return null;
  }

  return { state, codeVerifier, nonce };
}

export function storePkceState(
  state: string,
  codeVerifier: string,
  nonce: string,
  flow: OidcPkceFlow = "primary",
): void {
  const keys = pkceStorageKeys(flow);

  sessionStorage.setItem(keys.stateKey, state);
  sessionStorage.setItem(keys.codeVerifierKey, codeVerifier);
  sessionStorage.setItem(keys.nonceKey, nonce);
}

export function readPkceState(flow: OidcPkceFlow = "primary"): Omit<StoredPkceState, "flow"> | null {
  return readPkceStateForFlow(flow);
}

export function consumePkceState(expectedState: string): StoredPkceState | null {
  const flows: OidcPkceFlow[] = ["primary", "google"];

  for (const flow of flows) {
    const pair = readPkceStateForFlow(flow);

    if (!pair || pair.state !== expectedState) {
      continue;
    }

    const keys = pkceStorageKeys(flow);
    removeOidcKeys([keys.stateKey, keys.codeVerifierKey, keys.nonceKey]);

    return { ...pair, flow };
  }

  return null;
}

/**
 * Persists a post-sign-in return URL so the callback can restore the user's position
 * after a session-expiry sign-in. Rejects anything that is not a safe same-origin
 * relative path (open-redirect protection) — unsafe values are silently dropped.
 */
export function storePostSignInReturnUrl(url: string): void {
  if (isSafeReturnPath(url)) {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, url);
  }
}

/**
 * Reads and clears the stored post-sign-in return URL (single-use).
 * Returns null when absent, never written, or (defense in depth) no longer a safe path.
 */
export function consumePostSignInReturnUrl(): string | null {
  const url = readSessionKey(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  sessionStorage.removeItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  return isSafeReturnPath(url) ? url : null;
}

function getExpiresAtMs(): number {
  const raw = readSessionKey(OIDC_EXPIRES_AT_MS_KEY) ?? "0";
  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : 0;
}

/** Access token expiry (epoch ms), or 0 when unknown. */
export function getAccessTokenExpiresAtMs(): number {
  if (typeof sessionStorage === "undefined") {
    return 0;
  }

  return getExpiresAtMs();
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

  const token = readSessionKey(OIDC_ACCESS_TOKEN_KEY);

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
  const refresh = readSessionKey(OIDC_REFRESH_TOKEN_KEY) ?? "";
  const authority = getOidcAuthority();
  const clientId = getOidcClientId();

  if (!refresh || !authority || !clientId) {
    return;
  }

  if (Date.now() < exp - EXPIRY_SKEW_MS) {
    return;
  }

  if (!refreshInFlight) {
    const generationAtStart = refreshSessionGeneration;
    let activeRefreshPromise: Promise<void> | null = null;
    activeRefreshPromise = (async () => {
      try {
        const doc = await loadDiscoveryDocument(authority);
        const tokens = await refreshAccessToken({
          tokenEndpoint: doc.token_endpoint,
          clientId,
          refreshToken: refresh,
        });

        if (generationAtStart === refreshSessionGeneration) {
          persistTokenResponse(tokens);
        }
      } catch (error: unknown) {
        if (
          generationAtStart === refreshSessionGeneration &&
          shouldClearOidcSessionOnRefreshFailure(error)
        ) {
          clearOidcSession();
        }
      } finally {
        if (refreshInFlight === activeRefreshPromise) {
          refreshInFlight = null;
        }
      }
    })();
    refreshInFlight = activeRefreshPromise;
  }

  await refreshInFlight;
}

export function readSignedInDisplayName(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const access = readSessionKey(OIDC_ACCESS_TOKEN_KEY);
  const idTok = readSessionKey(OIDC_ID_TOKEN_KEY);

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

  const token = readSessionKey(OIDC_ACCESS_TOKEN_KEY);

  return Boolean(token && token.length > 0 && Date.now() < getExpiresAtMs() - EXPIRY_SKEW_MS);
}

/**
 * Clears local session and redirects to the IdP end_session endpoint when available (OIDC RP-initiated logout).
 */
export async function signOutAndRedirectHome(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const idToken = readSessionKey(OIDC_ID_TOKEN_KEY) ?? undefined;
  const authority = getOidcAuthority();

  clearOidcSession();
  clearOperatorScopeStorage();

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
