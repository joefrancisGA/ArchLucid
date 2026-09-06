import { clearCachedColorModePreference } from "@/lib/color-mode-preference";
import { clearOperatorScopeStorage } from "@/lib/operator/operator-scope-storage";
import {
  getOidcAuthority,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import {
  OIDC_CODE_VERIFIER_KEY,
  OIDC_DISPLAY_NAME_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_GOOGLE_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_NONCE_KEY,
  OIDC_GOOGLE_OAUTH_STATE_KEY,
  OIDC_ID_TOKEN_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  OIDC_REFRESH_TOKEN_KEY,
  OIDC_USER_SUBJECT_KEY,
  OIDC_ACCESS_TOKEN_KEY,
} from "@/lib/oidc/storage-keys";
import { decodeJwtPayload, pickDisplayNameFromPayload } from "@/lib/oidc/jwt-payload";
import type { OidcTokenResponse } from "@/lib/oidc/token-client";
import {
  clearBffSessionCookie,
  refreshBffSessionCookie,
  resolveRpLogoutUrlFromBffSession,
  syncBffSessionCookieFromTokenResponse,
} from "@/lib/oidc/bff-session-sync";
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

function persistNonSensitiveSessionHints(tokens: OidcTokenResponse, expiresAtMs: number): void {
  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(expiresAtMs));

  const accessPayload = decodeJwtPayload(tokens.access_token);
  const displayNameFromAccess = pickDisplayNameFromPayload(accessPayload);
  const displayNameFromId =
    displayNameFromAccess ??
    (tokens.id_token ? pickDisplayNameFromPayload(decodeJwtPayload(tokens.id_token)) : null);

  if (displayNameFromId) {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, displayNameFromId);
  }

  const subject = accessPayload?.sub;

  if (typeof subject === "string" && subject.trim().length > 0) {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, subject.trim());
  }
}

/**
 * Persists OIDC sign-in state for Working GA (LK-06 P2).
 * Token material is issued only to the HttpOnly BFF cookie; PKCE verifier/state may remain in sessionStorage.
 */
export function persistTokenResponse(tokens: OidcTokenResponse): void {
  if (typeof tokens.access_token !== "string" || tokens.access_token.trim().length === 0) {
    throw new Error("OIDC token response missing access_token");
  }

  const expiresInSec = resolveExpiresInSeconds(tokens.expires_in);
  const expiresAtMs = Date.now() + expiresInSec * 1000;

  persistNonSensitiveSessionHints(tokens, expiresAtMs);
  void syncBffSessionCookieFromTokenResponse(tokens);
}

export function clearOidcSession(): void {
  refreshSessionGeneration += 1;
  refreshInFlight = null;
  removeOidcKeys([
    OIDC_ACCESS_TOKEN_KEY,
    OIDC_REFRESH_TOKEN_KEY,
    OIDC_EXPIRES_AT_MS_KEY,
    OIDC_ID_TOKEN_KEY,
    OIDC_DISPLAY_NAME_KEY,
    OIDC_USER_SUBJECT_KEY,
    OIDC_OAUTH_STATE_KEY,
    OIDC_CODE_VERIFIER_KEY,
    OIDC_NONCE_KEY,
    OIDC_GOOGLE_OAUTH_STATE_KEY,
    OIDC_GOOGLE_CODE_VERIFIER_KEY,
    OIDC_GOOGLE_NONCE_KEY,
    OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  ]);
  clearCachedColorModePreference();
  void clearBffSessionCookie();
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

/** PKCE OAuth state is short-lived and not an access token — safe in sessionStorage (LK-06 P2). */
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
 * LK-06 P2: access tokens are not readable from JS — proxy auth uses the HttpOnly BFF cookie.
 */
export function getAccessTokenForApi(): string | undefined {
  return undefined;
}

/**
 * Refreshes via the BFF when within skew of expiry. No-op when not in browser JWT mode.
 */
export async function ensureAccessTokenFresh(): Promise<void> {
  if (typeof window === "undefined" || !isJwtAuthMode()) {
    return;
  }

  const exp = getExpiresAtMs();

  if (Date.now() < exp - EXPIRY_SKEW_MS) {
    return;
  }

  if (!refreshInFlight) {
    const generationAtStart = refreshSessionGeneration;
    let activeRefreshPromise: Promise<void> | null = null;
    activeRefreshPromise = (async () => {
      try {
        const result = await refreshBffSessionCookie();

        if (generationAtStart !== refreshSessionGeneration) {
          return;
        }

        if (result.ok) {
          sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(result.expiresAtMs));

          return;
        }

        if (result.shouldClearSession) {
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

  return readSessionKey(OIDC_DISPLAY_NAME_KEY);
}

export function readSignedInUserSubject(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return readSessionKey(OIDC_USER_SUBJECT_KEY);
}

export function isLikelySignedIn(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  const exp = getExpiresAtMs();

  return exp > 0 && Date.now() < exp - EXPIRY_SKEW_MS;
}

/**
 * Clears local session and redirects to the IdP end_session endpoint when available (OIDC RP-initiated logout).
 */
export async function signOutAndRedirectHome(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const rpLogoutUrl = await resolveRpLogoutUrlFromBffSession();

  clearOidcSession();
  clearOperatorScopeStorage();

  if (rpLogoutUrl) {
    window.location.assign(rpLogoutUrl);

    return;
  }

  const authority = getOidcAuthority();

  if (!authority) {
    window.location.assign("/");

    return;
  }

  window.location.assign("/");
}
