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
  readPkceState,
  readPostSignInReturnUrl,
  storePkceState,
  storePostSignInReturnUrl,
} from "@/lib/oidc/session";
import { OIDC_POST_SIGN_IN_RETURN_URL_KEY } from "@/lib/oidc/storage-keys";

function clearAbandonedPostSignInReturnUrl(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const current = sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY);

  if (current === null) {
    return;
  }

  const idle = readIdleDeskRestorePayload();

  if (idle !== null) {
    const currentNormalized = normalizeOidcConfigurationString(current);
    const currentComparable = normalizeComparableReturnPath(currentNormalized);
    const idleComparable = normalizeComparableReturnPath(idle.returnPath);

    if (
      currentComparable !== null &&
      idleComparable !== null &&
      currentComparable === idleComparable &&
      isSafeReturnPath(currentNormalized)
    ) {
      return;
    }
  }

  clearPostSignInReturnUrl();
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

/**
 * Builds the IdP authorization URL and navigates the browser to it.
 * Stores PKCE state and an optional post-sign-in return URL before redirecting.
 * Shared by the sign-in page and the session-expired page so both start OIDC identically.
 * @param returnUrl - Relative URL to restore after successful sign-in (must start with "/";
 *   unsafe values are dropped by `storePostSignInReturnUrl`, not rejected here).
 */
export async function initiateOidcRedirect(returnUrl?: string): Promise<void> {
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
  let consumedAuthorizeCallbackRetry = false;
  const preservingAuthorizeCallbackRetry = hasAuthorizeCallbackFailedRetry();

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    if (shouldConsumeAuthorizeRetryForReturnUrl(returnUrl)) {
      consumedAuthorizeCallbackRetry = consumeAuthorizeCallbackFailedRetry();
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

    if (storedReturnUrlThisAttempt && preservingAuthorizeCallbackRetry && !consumedAuthorizeCallbackRetry) {
      markAuthorizeCallbackFailed();
    } else if (storedReturnUrlThisAttempt) {
      clearPostSignInReturnUrl();
    } else if (preservingAuthorizeCallbackRetry) {
      markAuthorizeCallbackFailed();
    } else if (readPkceState("google") === null) {
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
  let consumedAuthorizeCallbackRetry = false;
  const preservingAuthorizeCallbackRetry = hasAuthorizeCallbackFailedRetry();

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    if (shouldConsumeAuthorizeRetryForReturnUrl(returnUrl)) {
      consumedAuthorizeCallbackRetry = consumeAuthorizeCallbackFailedRetry();
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

    if (storedReturnUrlThisAttempt && preservingAuthorizeCallbackRetry && !consumedAuthorizeCallbackRetry) {
      markAuthorizeCallbackFailed();
    } else if (storedReturnUrlThisAttempt) {
      clearPostSignInReturnUrl();
    } else if (preservingAuthorizeCallbackRetry) {
      markAuthorizeCallbackFailed();
    } else if (readPkceState("primary") === null) {
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
