import {
  getGoogleOidcAuthority,
  getGoogleOidcClientId,
  getGoogleOidcScopes,
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
  getOidcScopes,
} from "@/lib/oidc/config";
import { buildAuthorizeUrl } from "@/lib/oidc/build-authorize-url";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { createPkcePair, randomOpaqueState } from "@/lib/oidc/pkce";
import {
  normalizeComparableReturnPath,
  readIdleDeskRestorePayload,
} from "@/lib/auth/idle-desk-restore";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { normalizeOidcConfigurationString } from "@/lib/oidc/oauth-callback-messages";
import {
  clearPkceState,
  clearPostSignInReturnUrl,
  consumeAuthorizeCallbackFailedRetry,
  hasAuthorizeCallbackFailedRetry,
  markAuthorizeCallbackFailed,
  readAuthorizeRetryReturnPathSnapshot,
  readPkceState,
  readPostSignInReturnUrl,
  storePkceState,
  storePostSignInReturnUrl,
} from "@/lib/oidc/session";

function clearAbandonedPostSignInReturnUrl(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const current = readPostSignInReturnUrl();

  if (current === null) {
    return;
  }

  const idle = readIdleDeskRestorePayload();

  if (idle !== null) {
    const currentComparable = normalizeComparableReturnPath(current);
    const idleComparable = normalizeComparableReturnPath(idle.returnPath);

    if (
      currentComparable !== null &&
      idleComparable !== null &&
      currentComparable === idleComparable
    ) {
      return;
    }
  }

  clearPostSignInReturnUrl();
}

/** Purges unsafe stored return paths and restores idle-desk backup when authorize retry is pending. */
function preparePostSignInReturnUrlForSignInStart(): void {
  readPostSignInReturnUrl();

  if (!hasAuthorizeCallbackFailedRetry()) {
    return;
  }

  if (readPostSignInReturnUrl() !== null) {
    return;
  }

  const retryReturnPath = readAuthorizeRetryReturnPathSnapshot();

  if (retryReturnPath !== null) {
    storePostSignInReturnUrl(retryReturnPath);

    return;
  }

  const idle = readIdleDeskRestorePayload();

  if (idle === null) {
    return;
  }

  storePostSignInReturnUrl(idle.returnPath);
}

function shouldConsumeAuthorizeRetryForReturnUrl(returnUrl: string): boolean {
  const normalizedNew = normalizeOidcConfigurationString(returnUrl);
  const prior = readPostSignInReturnUrl();

  if (prior === null) {
    return true;
  }

  const priorComparable = normalizeComparableReturnPath(prior);
  const newComparable = normalizeComparableReturnPath(normalizedNew);

  return priorComparable !== newComparable;
}

function handleInitiateDiscoveryFailure(options: {
  storedReturnUrlThisAttempt: boolean;
  preservingAuthorizeCallbackRetry: boolean;
}): void {
  const { storedReturnUrlThisAttempt, preservingAuthorizeCallbackRetry } = options;

  if (storedReturnUrlThisAttempt) {
    if (preservingAuthorizeCallbackRetry) {
      markAuthorizeCallbackFailed();
    } else {
      clearPostSignInReturnUrl();
    }

    return;
  }

  if (preservingAuthorizeCallbackRetry) {
    markAuthorizeCallbackFailed();
  }
}

/**
 * Builds the IdP authorization URL and navigates the browser to it.
 * Stores PKCE state and an optional post-sign-in return URL before redirecting.
 * Shared by the sign-in page and the session-expired page so both start OIDC identically.
 * @param returnUrl - Relative URL to restore after successful sign-in (must start with "/";
 *   unsafe values are dropped by `storePostSignInReturnUrl`, not rejected here).
 */
export async function initiateOidcRedirect(returnUrl?: string): Promise<void> {
  preparePostSignInReturnUrlForSignInStart();

  const authority = getOidcAuthority();
  const clientId = getOidcClientId();
  const redirectUri = getOidcRedirectUri();
  const scope = getOidcScopes();
  const { verifier, challenge } = await createPkcePair();
  const state = randomOpaqueState();
  const nonce = randomOpaqueState();

  clearPkceState("google");
  storePkceState(state, verifier, nonce, "primary");

  let storedReturnUrlThisAttempt = false;
  const preservingAuthorizeCallbackRetry = hasAuthorizeCallbackFailedRetry();

  if (preservingAuthorizeCallbackRetry) {
    // Drop tampered legacy absolute return URLs without clearing authorize-retry state.
    readPostSignInReturnUrl();
  }

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    const consumeAuthorizeRetryMarker = shouldConsumeAuthorizeRetryForReturnUrl(returnUrl);

    if (consumeAuthorizeRetryMarker) {
      consumeAuthorizeCallbackFailedRetry();
    }

    storePostSignInReturnUrl(returnUrl);
    storedReturnUrlThisAttempt = true;
  } else if (readPkceState("google") === null) {
    if (!preservingAuthorizeCallbackRetry) {
      clearAbandonedPostSignInReturnUrl();
    }
  }

  let doc;

  try {
    doc = await loadDiscoveryDocument(authority);
  } catch (error) {
    clearPkceState("primary");

    handleInitiateDiscoveryFailure({
      storedReturnUrlThisAttempt,
      preservingAuthorizeCallbackRetry,
    });

    if (
      !storedReturnUrlThisAttempt &&
      !preservingAuthorizeCallbackRetry &&
      readPkceState("google") === null
    ) {
      clearAbandonedPostSignInReturnUrl();
    }

    throw error;
  }
  const url = buildAuthorizeUrl({
    doc,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge: challenge,
    nonce,
  });

  clearPkceState("google");
  window.location.assign(url);
}

/**
 * Starts OIDC for an explicitly configured supplemental provider (e.g. Google when
 * `NEXT_PUBLIC_GOOGLE_OIDC_*` is set separately from the primary work/school IdP).
 */
export async function initiateSupplementalOidcRedirect(
  provider: "google",
  returnUrl?: string,
): Promise<void> {
  if (provider !== "google") {
    throw new Error("Unsupported supplemental identity provider.");
  }

  preparePostSignInReturnUrlForSignInStart();

  const authority = getGoogleOidcAuthority();
  const clientId = getGoogleOidcClientId();

  if (authority.length === 0 || clientId.length === 0) {
    throw new Error("Google sign-in is not configured for this environment.");
  }

  const redirectUri = getOidcRedirectUri();
  const scope = getGoogleOidcScopes();
  const { verifier, challenge } = await createPkcePair();
  const state = randomOpaqueState();
  const nonce = randomOpaqueState();

  clearPkceState("primary");
  storePkceState(state, verifier, nonce, "google");

  let storedReturnUrlThisAttempt = false;
  const preservingAuthorizeCallbackRetry = hasAuthorizeCallbackFailedRetry();

  if (preservingAuthorizeCallbackRetry) {
    readPostSignInReturnUrl();
  }

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    const consumeAuthorizeRetryMarker = shouldConsumeAuthorizeRetryForReturnUrl(returnUrl);

    if (consumeAuthorizeRetryMarker) {
      consumeAuthorizeCallbackFailedRetry();
    }

    storePostSignInReturnUrl(returnUrl);
    storedReturnUrlThisAttempt = true;
  } else if (readPkceState("primary") === null) {
    if (!preservingAuthorizeCallbackRetry) {
      clearAbandonedPostSignInReturnUrl();
    }
  }

  let doc;

  try {
    doc = await loadDiscoveryDocument(authority);
  } catch (error) {
    clearPkceState("google");

    handleInitiateDiscoveryFailure({
      storedReturnUrlThisAttempt,
      preservingAuthorizeCallbackRetry,
    });

    if (
      !storedReturnUrlThisAttempt &&
      !preservingAuthorizeCallbackRetry &&
      readPkceState("primary") === null
    ) {
      clearAbandonedPostSignInReturnUrl();
    }

    throw error;
  }
  const url = buildAuthorizeUrl({
    doc,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge: challenge,
    nonce,
  });

  clearPkceState("primary");
  window.location.assign(url);
}
