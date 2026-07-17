import {
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
  getOidcScopes,
} from "@/lib/oidc/config";
import { buildAuthorizeUrl } from "@/lib/oidc/build-authorize-url";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { createPkcePair, randomOpaqueState } from "@/lib/oidc/pkce";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { storePkceState, storePostSignInReturnUrl } from "@/lib/oidc/session";

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

  storePkceState(state, verifier, nonce);

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    storePostSignInReturnUrl(returnUrl);
  }

  const doc = await loadDiscoveryDocument(authority);
  const url = buildAuthorizeUrl({
    doc,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge: challenge,
    nonce,
  });

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

  const authority = process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY?.trim() ?? "";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID?.trim() ?? "";

  if (authority.length === 0 || clientId.length === 0) {
    throw new Error("Google sign-in is not configured for this environment.");
  }

  const redirectUri = getOidcRedirectUri();
  const scope = process.env.NEXT_PUBLIC_GOOGLE_OIDC_SCOPES?.trim() || "openid profile email";
  const { verifier, challenge } = await createPkcePair();
  const state = randomOpaqueState();
  const nonce = randomOpaqueState();

  storePkceState(state, verifier, nonce);

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    storePostSignInReturnUrl(returnUrl);
  }

  const doc = await loadDiscoveryDocument(authority);
  const url = buildAuthorizeUrl({
    doc,
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge: challenge,
    nonce,
  });

  window.location.assign(url);
}
