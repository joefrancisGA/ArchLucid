import { postSessionIdleBroadcastMessage } from "@/lib/auth/session-idle-broadcast";
import { clearCachedColorModePreference } from "@/lib/color-mode-preference";
import { clearInfraEvidenceAskTranscriptStorage } from "@/lib/infra-evidence/infra-evidence-ask-transcript";
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
  OIDC_AUTHORIZE_CALLBACK_FAILED_KEY,
  OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY,
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
import { canonicalSafeReturnPath } from "@/lib/navigation/safe-return-path";
import {
  normalizeOidcConfigurationString,
  normalizeOidcDisplayString,
  normalizeOidcOpaqueOAuthString,
  parseOidcEpochMsHint,
  stripOAuthInvisibleFormatChars,
} from "@/lib/oidc/oauth-callback-messages";
import { resolveExpiresInSeconds } from "@/lib/oidc/resolve-expires-in-seconds";

export type OidcPkceFlow = "primary" | "google";

type StoredPkceState = {
  state: string;
  codeVerifier: string;
  nonce: string;
  flow: OidcPkceFlow;
};

const EXPIRY_SKEW_MS = 60_000;

function normalizePkceCallbackQueryValue(value: string): string {
  return normalizeOidcOpaqueOAuthString(value);
}

let refreshInFlight: Promise<void> | null = null;
let refreshSessionGeneration = 0;
let latestTokenSyncGeneration = -1;
let tokenSyncSequence = 0;

type TokenSyncRequest = {
  readonly sequence: number;
  readonly generation: number;
  readonly tokens: OidcTokenResponse;
};

let latestTokenSyncRequest: TokenSyncRequest | null = null;

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

function readNormalizedIdentitySessionKey(key: string): string | null {
  const value = readSessionKey(key);

  if (value === null) {
    return null;
  }

  const normalized = normalizeOidcConfigurationString(value);

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
}

function removeOidcKeys(keys: readonly string[]): void {
  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

function readNormalizedSubjectFromPayload(payload: Record<string, unknown> | null): string | null {
  if (payload === null || typeof payload.sub !== "string") {
    return null;
  }

  const normalizedSubject = normalizeOidcConfigurationString(payload.sub);

  if (normalizedSubject.length === 0) {
    return null;
  }

  return normalizedSubject;
}

type OidcIdentityHintsSnapshot = {
  readonly subjectHint: string | null;
  readonly displayHint: string | null;
};

function readOidcIdentityHintsSnapshot(): OidcIdentityHintsSnapshot {
  return {
    subjectHint: readSignedInUserSubject(),
    displayHint: readSignedInDisplayName(),
  };
}

function oidcIdentityHintsChanged(
  before: OidcIdentityHintsSnapshot,
  after: OidcIdentityHintsSnapshot,
): boolean {
  return before.subjectHint !== after.subjectHint || before.displayHint !== after.displayHint;
}

function persistNonSensitiveSessionHints(tokens: OidcTokenResponse, expiresAtMs: number): void {
  removeOidcKeys([OIDC_DISPLAY_NAME_KEY, OIDC_USER_SUBJECT_KEY]);

  const accessPayload = decodeJwtPayload(tokens.access_token);
  const idPayload = tokens.id_token ? decodeJwtPayload(tokens.id_token) : null;
  const displayNameFromAccess = pickDisplayNameFromPayload(accessPayload);
  const displayNameFromId = displayNameFromAccess ?? pickDisplayNameFromPayload(idPayload);

  if (displayNameFromId) {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, displayNameFromId);
  }

  const normalizedSubject = readNormalizedSubjectFromPayload(accessPayload) ?? readNormalizedSubjectFromPayload(idPayload);

  if (normalizedSubject !== null) {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, normalizedSubject);
  }

  if (!hasOidcSessionIdentityHints()) {
    sessionStorage.removeItem(OIDC_EXPIRES_AT_MS_KEY);

    return;
  }

  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(expiresAtMs));
}

async function syncTokenToBff(request: TokenSyncRequest): Promise<void> {
  if (request.generation !== refreshSessionGeneration) {
    return;
  }

  await syncBffSessionCookieFromTokenResponse(request.tokens);

  if (request.generation !== refreshSessionGeneration) {
    const latestRequest = latestTokenSyncRequest;

    if (
      latestRequest &&
      latestRequest.generation === refreshSessionGeneration &&
      latestRequest.sequence !== request.sequence
    ) {
      // A late stale POST must not be the final BFF cookie when a replacement session exists.
      await syncTokenToBff(latestRequest);

      return;
    }

    // Keep stale sign-in cleanup from deleting a replacement session's cookie.
    if (latestTokenSyncGeneration !== refreshSessionGeneration) {
      await clearBffSessionCookie();
    }

    return;
  }

  const latestRequest = latestTokenSyncRequest;

  if (latestRequest && latestRequest.sequence !== request.sequence) {
    // A newer request may have completed before this response. Reapply it so
    // a late older response cannot become the final BFF cookie value.
    await syncTokenToBff(latestRequest);
  }
}

/**
 * Persists OIDC sign-in state for Working GA (LK-06 P2).
 * Token material is issued only to the HttpOnly BFF cookie; PKCE verifier/state may remain in sessionStorage.
 */
export function persistTokenResponse(tokens: OidcTokenResponse): void {
  if (typeof tokens.access_token !== "string") {
    throw new Error("OIDC token response missing access_token");
  }

  const accessToken = normalizeOidcConfigurationString(tokens.access_token);

  if (accessToken.length === 0) {
    throw new Error("OIDC token response missing access_token");
  }

  const normalizedTokens: OidcTokenResponse =
    accessToken === tokens.access_token ? tokens : { ...tokens, access_token: accessToken };

  const expiresInSec = resolveExpiresInSeconds(tokens.expires_in);
  const expiresAtMs = Date.now() + expiresInSec * 1000;
  const identityHintsBeforePersist = readOidcIdentityHintsSnapshot();

  persistNonSensitiveSessionHints(normalizedTokens, expiresAtMs);

  if (!hasOidcSessionIdentityHints()) {
    // Invalidate in-flight BFF sync so a late POST cannot resurrect the HttpOnly cookie.
    refreshSessionGeneration += 1;
    refreshInFlight = null;
    latestTokenSyncRequest = null;
    void clearBffSessionCookie();
    notifyAuthContextChanged();

    return;
  }

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY);
    sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);
  }

  const identityHintsAfterPersist = readOidcIdentityHintsSnapshot();

  if (oidcIdentityHintsChanged(identityHintsBeforePersist, identityHintsAfterPersist)) {
    // Any identity hint change during persist must ignore stale in-flight BFF refresh results.
    refreshSessionGeneration += 1;
    refreshInFlight = null;
  }

  const generationAtPersist = refreshSessionGeneration;
  latestTokenSyncGeneration = generationAtPersist;
  const request: TokenSyncRequest = {
    sequence: ++tokenSyncSequence,
    generation: generationAtPersist,
    tokens: normalizedTokens,
  };
  latestTokenSyncRequest = request;

  notifyAuthContextChanged();
  void syncTokenToBff(request);
}

function notifyAuthContextChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("archlucid:auth-context-changed"));
  }
}

export type ClearOidcSessionOptions = {
  readonly broadcastAuthCleared?: boolean;
};

export function clearOidcSession(options?: ClearOidcSessionOptions): void {
  const hadSignedInIdentity = hasOidcSessionIdentityHints();
  refreshSessionGeneration += 1;
  refreshInFlight = null;
  clearInfraEvidenceAskTranscriptStorage();
  const keysToClear = [
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
  ];

  if (hadSignedInIdentity) {
    keysToClear.push(
      OIDC_POST_SIGN_IN_RETURN_URL_KEY,
      OIDC_AUTHORIZE_CALLBACK_FAILED_KEY,
      OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY,
    );
  }

  removeOidcKeys(keysToClear);
  notifyAuthContextChanged();
  clearCachedColorModePreference();
  void clearBffSessionCookie();

  if (options?.broadcastAuthCleared !== false) {
    postSessionIdleBroadcastMessage({ type: "auth-cleared" });
  }
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

function pkceStoredValueContainsUnsafeControlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F\u2028\u2029\u0085]/u.test(value);
}

function readPkceStateForFlow(flow: OidcPkceFlow): Omit<StoredPkceState, "flow"> | null {
  const keys = pkceStorageKeys(flow);
  const state = readSessionKey(keys.stateKey);
  const codeVerifier = readSessionKey(keys.codeVerifierKey);
  const nonce = readSessionKey(keys.nonceKey);

  if (!state || !codeVerifier || !nonce) {
    return null;
  }

  if (
    pkceStoredValueContainsUnsafeControlCharacters(state)
    || pkceStoredValueContainsUnsafeControlCharacters(codeVerifier)
    || pkceStoredValueContainsUnsafeControlCharacters(nonce)
  ) {
    return null;
  }

  const normalizedState = normalizePkceCallbackQueryValue(state);
  const normalizedVerifier = normalizePkceCallbackQueryValue(codeVerifier);
  const normalizedNonce = normalizePkceCallbackQueryValue(nonce);

  if (normalizedState.length === 0 || normalizedVerifier.length === 0 || normalizedNonce.length === 0) {
    return null;
  }

  return {
    state: normalizedState,
    codeVerifier: normalizedVerifier,
    nonce: normalizedNonce,
  };
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

export function clearPkceState(flow: OidcPkceFlow = "primary"): void {
  const keys = pkceStorageKeys(flow);

  removeOidcKeys([keys.stateKey, keys.codeVerifierKey, keys.nonceKey]);
}

export function readPkceState(flow: OidcPkceFlow = "primary"): Omit<StoredPkceState, "flow"> | null {
  return readPkceStateForFlow(flow);
}

export function consumePkceState(expectedState: string): StoredPkceState | null {
  const normalizedExpected = normalizePkceCallbackQueryValue(expectedState);

  if (normalizedExpected.length === 0) {
    return null;
  }

  const flows: OidcPkceFlow[] = ["primary", "google"];

  for (const flow of flows) {
    const pair = readPkceStateForFlow(flow);

    if (!pair || normalizePkceCallbackQueryValue(pair.state) !== normalizedExpected) {
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
  const normalized = normalizeOidcConfigurationString(url);
  const safe = canonicalSafeReturnPath(normalized);

  if (safe !== null) {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, safe);
  }
}

/** Reads the stored post-sign-in return URL without clearing it (safe paths only). */
export function readPostSignInReturnUrl(): string | null {
  const url = readSessionKey(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  if (url === null) {
    return null;
  }

  const safe = canonicalSafeReturnPath(normalizeOidcConfigurationString(url));

  if (safe === null) {
    sessionStorage.removeItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

    return null;
  }

  return safe;
}

export function clearPostSignInReturnUrl(): void {
  sessionStorage.removeItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY);
  sessionStorage.removeItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY);
  sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);
}

function snapshotAuthorizeRetryReturnPath(): void {
  const url = readSessionKey(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  if (url === null) {
    return;
  }

  const safe = canonicalSafeReturnPath(normalizeOidcConfigurationString(url));

  if (safe === null) {
    return;
  }

  sessionStorage.setItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY, safe);
}

/** Reads the safe return path captured when authorize callback retry was marked. */
export function readAuthorizeRetryReturnPathSnapshot(): string | null {
  const url = readSessionKey(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);

  if (url === null) {
    return null;
  }

  const safe = canonicalSafeReturnPath(normalizeOidcConfigurationString(url));

  if (safe === null) {
    sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);

    return null;
  }

  return safe;
}

/** Marks that the authorize callback returned an OAuth error so a retry keeps the stored return URL. */
export function markAuthorizeCallbackFailed(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  snapshotAuthorizeRetryReturnPath();
  sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");
}

/** True when the authorize callback set a retry marker that should keep the stored return URL. */
export function hasAuthorizeCallbackFailedRetry(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  return sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY) === "1";
}

/**
 * Returns whether an authorize callback error is pending a sign-in retry and clears the marker.
 */
export function consumeAuthorizeCallbackFailedRetry(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  const pending = sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY) === "1";

  sessionStorage.removeItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY);
  sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);

  return pending;
}

/**
 * Reads and clears the stored post-sign-in return URL (single-use).
 * Returns null when absent, never written, or (defense in depth) no longer a safe path.
 */
export function consumePostSignInReturnUrl(): string | null {
  const url = readSessionKey(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  sessionStorage.removeItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  if (url === null) {
    sessionStorage.removeItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY);
    sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);

    return null;
  }

  const safe = canonicalSafeReturnPath(normalizeOidcConfigurationString(url));

  if (safe === null) {
    return null;
  }

  sessionStorage.removeItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY);
  sessionStorage.removeItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY);

  return safe;
}

function getExpiresAtMs(): number {
  const raw = readSessionKey(OIDC_EXPIRES_AT_MS_KEY) ?? "0";
  const parsed = parseOidcEpochMsHint(raw);

  return Number.isFinite(parsed) ? parsed : 0;
}

function hasOidcSessionIdentityHints(): boolean {
  if (readSignedInUserSubject() !== null) {
    return true;
  }

  if (readSignedInDisplayName() !== null) {
    return true;
  }

  return false;
}

/** Access token expiry (epoch ms), or 0 when unknown. */
export function getAccessTokenExpiresAtMs(): number {
  if (typeof sessionStorage === "undefined") {
    return 0;
  }

  if (!hasOidcSessionIdentityHints()) {
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

  if (!hasOidcSessionIdentityHints()) {
    return;
  }

  if (!refreshInFlight) {
    const generationAtStart = refreshSessionGeneration;
    const expiresAtHintAtStart = getExpiresAtMs();
    const identityHintsAtRefreshStart = readOidcIdentityHintsSnapshot();
    let activeRefreshPromise: Promise<void> | null = null;
    activeRefreshPromise = (async () => {
      try {
        const result = await refreshBffSessionCookie();

        if (generationAtStart !== refreshSessionGeneration) {
          // The refresh POST may have completed after identity-less persist or sign-out cleared the cookie.
          if (result.ok && !hasOidcSessionIdentityHints()) {
            void clearBffSessionCookie();
          }

          return;
        }

        if (result.ok) {
          const identityHintsNow = readOidcIdentityHintsSnapshot();

          // Same-user token persist may update the client expiry hint while refresh is in flight;
          // still honor a successful BFF refresh unless identity hints changed (replacement sign-in).
          if (
            hasOidcSessionIdentityHints() &&
            !oidcIdentityHintsChanged(identityHintsAtRefreshStart, identityHintsNow)
          ) {
            const currentExpiresAtHintMs = getExpiresAtMs();

            // A pre-persist refresh may disagree with callback persist that moved the client hint.
            if (expiresAtHintAtStart !== currentExpiresAtHintMs) {
              const hintMovedForward = currentExpiresAtHintMs > expiresAtHintAtStart;
              const hintMovedBackward = currentExpiresAtHintMs < expiresAtHintAtStart;

              // After persist extends the hint, only accept a BFF ok refresh that matches it exactly.
              if (hintMovedForward && result.expiresAtMs !== currentExpiresAtHintMs) {
                return;
              }

              // After persist shortens the hint, reject a stale longer BFF expiry.
              if (hintMovedBackward && result.expiresAtMs > currentExpiresAtHintMs) {
                return;
              }
            }

            sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(result.expiresAtMs));
          }

          return;
        }

        if (result.shouldClearSession) {
          // A concurrent sign-in may have refreshed session hints while refresh was in flight.
          if (expiresAtHintAtStart === getExpiresAtMs()) {
            if (hasOidcSessionIdentityHints()) {
              clearOidcSession();
            } else {
              sessionStorage.removeItem(OIDC_EXPIRES_AT_MS_KEY);
              void clearBffSessionCookie();
            }
          }
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

  const value = readSessionKey(OIDC_DISPLAY_NAME_KEY);

  if (value === null) {
    return null;
  }

  const normalized = normalizeOidcDisplayString(value);

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
}

export function readSignedInUserSubject(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return readNormalizedIdentitySessionKey(OIDC_USER_SUBJECT_KEY);
}

export function isLikelySignedIn(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  if (!hasOidcSessionIdentityHints()) {
    return false;
  }

  const exp = getExpiresAtMs();

  return exp > 0 && Date.now() < exp;
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
