"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AuthCallbackAccessPanel } from "@/app/(operator)/auth/callback/AuthCallbackAccessPanel";
import { AuthCallbackBuyerChrome } from "@/app/(operator)/auth/callback/AuthCallbackBuyerChrome";
import { AuthCallbackLoadingView } from "@/app/(operator)/auth/callback/AuthCallbackLoadingView";

import {
  assertOidcSignInConfig,
  getGoogleOidcAuthority,
  getGoogleOidcClientId,
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import {
  exchangeAuthorizationCode,
  shouldMarkAuthorizeCallbackFailedOnExchangeError,
} from "@/lib/oidc/token-client";
import { decodeJwtPayload, readNonceFromPayload } from "@/lib/oidc/jwt-payload";
import { AUTH_CALLBACK_LOADING_DETAIL } from "@/lib/auth/auth-callback-page-copy";
import {
  BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE,
  toBuyerSafeAuthFailureMessage,
} from "@/lib/buyer/buyer-safe-auth-messages";
import {
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
  isObjectCoercionOAuthErrorValue,
  isPlaceholderOAuthErrorCodeLiteral,
  normalizeAuthorizeCallbackErrorCode,
  normalizeOAuthErrorCode,
  normalizeOidcOpaqueOAuthString,
  isUsableOAuthErrorUriValue,
} from "@/lib/oidc/oauth-callback-messages";
import {
  consumePkceState,
  consumePostSignInReturnUrl,
  markAuthorizeCallbackFailed,
  persistTokenResponse,
} from "@/lib/oidc/session";
import { restoreIdleDeskScopeAfterSignIn } from "@/lib/auth/idle-desk-restore";
import { clearFrictionlessTrialSessionForAuthenticatedOperator } from "@/lib/operator/operator-frictionless-trial-session-cleanup";
import { readInvitationToken } from "@/lib/auth/email-otp-session";
import { clearLastRegistrationPayload } from "@/lib/registration-session";

/** Matches `SignInClient` — token exchange can be slow on cold IdP or corporate proxies. */
const TOKEN_EXCHANGE_SLOW_HINT_MS = 8000;

function authCallbackChrome(content: ReactNode): React.JSX.Element {
  return <AuthCallbackBuyerChrome>{content}</AuthCallbackBuyerChrome>;
}

/** Keep stored post-sign-in return paths when the browser already landed on an IdP callback query. */
function shouldPreservePostSignInReturnForCallbackQuery(params: {
  oauthError: string | null;
  code: string | null;
  state: string | null;
}): boolean {
  const { oauthError, code, state } = params;

  if (oauthError !== null && oauthError.length > 0) {
    return true;
  }

  if (code && state) {
    return true;
  }

  if (!code || !state) {
    return true;
  }

  return false;
}

/**
 * OAuth2 authorization-code callback: exchanges ?code= for tokens (PKCE, public client).
 */
export function CallbackClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>(AUTH_CALLBACK_LOADING_DETAIL);
  const [failed, setFailed] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);

  const oauthErrorRaw = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError =
    oauthErrorRaw === null || oauthErrorRaw.length === 0
      ? null
      : normalizeAuthorizeCallbackErrorCode(oauthErrorRaw);
  const normalizedOAuthErrorCode =
    oauthError === null || oauthError.length === 0 ? null : normalizeOAuthErrorCode(oauthError);
  const oauthErrorForBranch =
    normalizedOAuthErrorCode !== null &&
    normalizedOAuthErrorCode.length > 0 &&
    !isPlaceholderOAuthErrorCodeLiteral(normalizedOAuthErrorCode) &&
    !isObjectCoercionOAuthErrorValue(normalizedOAuthErrorCode)
      ? normalizedOAuthErrorCode
      : null;
  const oauthErrorQueryPresent = searchParams.has("error");
  const oauthErrorDescriptionQueryPresent = searchParams.has("error_description");
  const oauthErrorUriRaw = searchParams.get("error_uri");
  const oauthErrorUriUsable = isUsableOAuthErrorUriValue(oauthErrorUriRaw);

  useEffect(() => {
    let canceled = false;

    /** Browser timer id — use `number` so Node’s `Timeout` typing does not clash with `window.setTimeout`. */
    let slowHintTimer: number | undefined;

    const clearSlowHintTimer = () => {
      if (slowHintTimer !== undefined) {
        window.clearTimeout(slowHintTimer);
        slowHintTimer = undefined;
      }
    };

    const fail = (msg: string, preserveReturnOnRetry = false) => {
      if (canceled) {
        return;
      }

      if (preserveReturnOnRetry) {
        markAuthorizeCallbackFailed();
      }

      setShowSlowHint(false);
      setFailed(true);
      setMessage(msg);
      clearSlowHintTimer();
    };

    const preserveReturnForQuery = shouldPreservePostSignInReturnForCallbackQuery({
      oauthError: oauthErrorRaw,
      code,
      state,
    });

    if (!isJwtAuthMode()) {
      fail(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE, preserveReturnForQuery);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      fail(cfg.message, preserveReturnForQuery);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (oauthErrorForBranch !== null) {
      if (state) {
        consumePkceState(state);
      }

      const decoded = decodeOAuthErrorDescription(oauthErrorDescription);
      fail(humanizeAuthorizeCallbackError(oauthErrorForBranch, decoded), true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (
      oauthErrorForBranch === null &&
      ((oauthErrorQueryPresent && (oauthErrorRaw === null || oauthErrorRaw.length === 0)) ||
        (oauthErrorRaw !== null && oauthErrorRaw.length > 0))
    ) {
      if (state) {
        consumePkceState(state);
      }

      fail("We did not receive a complete response from your identity provider. Start sign-in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (
      (oauthErrorDescriptionQueryPresent &&
        (oauthErrorDescription === null || oauthErrorDescription.length === 0)) ||
      (oauthErrorDescription !== null &&
        oauthErrorDescription.length > 0 &&
        decodeOAuthErrorDescription(oauthErrorDescription).length === 0)
    ) {
      if (state) {
        consumePkceState(state);
      }

      fail("We did not receive a complete response from your identity provider. Start sign-in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (
      oauthErrorForBranch === null &&
      oauthErrorDescriptionQueryPresent &&
      oauthErrorDescription !== null &&
      oauthErrorDescription.length > 0 &&
      decodeOAuthErrorDescription(oauthErrorDescription).length > 0
    ) {
      if (state) {
        consumePkceState(state);
      }

      fail("We did not receive a complete response from your identity provider. Start sign-in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (oauthErrorForBranch === null && oauthErrorUriUsable) {
      if (state) {
        consumePkceState(state);
      }

      fail("We did not receive a complete response from your identity provider. Start sign-in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    const normalizedCode = code === null ? null : normalizeOidcOpaqueOAuthString(code);
    const normalizedState = state === null ? null : normalizeOidcOpaqueOAuthString(state);

    if (
      normalizedCode === null ||
      normalizedCode.length === 0 ||
      normalizedState === null ||
      normalizedState.length === 0
    ) {
      if (normalizedState !== null && normalizedState.length > 0) {
        consumePkceState(normalizedState);
      }

      fail("We did not receive a complete response from your identity provider. Start sign-in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    const stored = consumePkceState(normalizedState);

    if (!stored) {
      fail("This sign-in attempt expired or was started in another window. Try signing in again.", true);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    void (async () => {
      slowHintTimer = window.setTimeout(() => {
        if (!canceled) {
          setShowSlowHint(true);
        }
      }, TOKEN_EXCHANGE_SLOW_HINT_MS);

      try {
        const authority = stored.flow === "google" ? getGoogleOidcAuthority() : getOidcAuthority();
        const clientId = stored.flow === "google" ? getGoogleOidcClientId() : getOidcClientId();
        const redirectUri = getOidcRedirectUri();
        const doc = await loadDiscoveryDocument(authority);
        const tokens = await exchangeAuthorizationCode({
          tokenEndpoint: doc.token_endpoint,
          clientId,
          code: normalizedCode,
          redirectUri,
          codeVerifier: stored.codeVerifier,
        });

        clearSlowHintTimer();

        if (canceled) {
          return;
        }

        if (tokens.id_token) {
          const idNonce = readNonceFromPayload(decodeJwtPayload(tokens.id_token));

          if (idNonce !== stored.nonce) {
            fail("Your identity response could not be verified securely. Try signing in again.", true);

            return;
          }
        }

        clearLastRegistrationPayload();
        persistTokenResponse(tokens);
        clearFrictionlessTrialSessionForAuthenticatedOperator();
        restoreIdleDeskScopeAfterSignIn();

        const returnUrl = consumePostSignInReturnUrl();
        const invitationToken = readInvitationToken();

        if (invitationToken) {
          const bootstrapParams = new URLSearchParams();

          if (returnUrl && returnUrl !== "/") {
            bootstrapParams.set("returnUrl", returnUrl);
          }

          const bootstrapPath = bootstrapParams.size > 0 ? `/auth/bootstrap?${bootstrapParams.toString()}` : "/auth/bootstrap";

          window.location.replace(bootstrapPath);

          return;
        }

        window.location.replace(returnUrl ?? "/");
      } catch (e) {
        clearSlowHintTimer();

        if (!canceled) {
          const message = e instanceof Error ? e.message : String(e);

          fail(message, shouldMarkAuthorizeCallbackFailedOnExchangeError(e));
        }
      }
    })();

    return () => {
      canceled = true;
      clearSlowHintTimer();
    };
  }, [
    code,
    oauthError,
    oauthErrorDescription,
    oauthErrorDescriptionQueryPresent,
    oauthErrorForBranch,
    oauthErrorQueryPresent,
    oauthErrorUriRaw,
    oauthErrorUriUsable,
    oauthErrorRaw,
    state,
  ]);

  if (failed) {
    return authCallbackChrome(
      <AuthCallbackAccessPanel technicalDetail={toBuyerSafeAuthFailureMessage(message)} />,
    );
  }

  return authCallbackChrome(<AuthCallbackLoadingView message={message} showSlowHint={showSlowHint} />);
}
