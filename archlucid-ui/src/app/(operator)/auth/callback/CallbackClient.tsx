"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AuthCallbackAccessPanel } from "@/app/(operator)/auth/callback/AuthCallbackAccessPanel";
import { AuthCallbackBuyerChrome } from "@/app/(operator)/auth/callback/AuthCallbackBuyerChrome";
import { AuthCallbackLoadingView } from "@/app/(operator)/auth/callback/AuthCallbackLoadingView";

import {
  assertOidcSignInConfig,
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { exchangeAuthorizationCode } from "@/lib/oidc/token-client";
import { decodeJwtPayload, readNonceFromPayload } from "@/lib/oidc/jwt-payload";
import { AUTH_CALLBACK_LOADING_DETAIL } from "@/lib/auth/auth-callback-page-copy";
import {
  BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE,
  toBuyerSafeAuthFailureMessage,
} from "@/lib/buyer/buyer-safe-auth-messages";
import {
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
} from "@/lib/oidc/oauth-callback-messages";
import { consumePkceState, persistTokenResponse, consumePostSignInReturnUrl } from "@/lib/oidc/session";
import { readInvitationToken } from "@/lib/auth/email-otp-session";
import { clearLastRegistrationPayload } from "@/lib/registration-session";

/** Matches `SignInClient` — token exchange can be slow on cold IdP or corporate proxies. */
const TOKEN_EXCHANGE_SLOW_HINT_MS = 8000;

function authCallbackChrome(content: ReactNode): React.JSX.Element {
  return <AuthCallbackBuyerChrome>{content}</AuthCallbackBuyerChrome>;
}

/**
 * OAuth2 authorization-code callback: exchanges ?code= for tokens (PKCE, public client).
 */
export function CallbackClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>(AUTH_CALLBACK_LOADING_DETAIL);
  const [failed, setFailed] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

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

    const fail = (msg: string) => {
      if (canceled) {
        return;
      }

      setShowSlowHint(false);
      setFailed(true);
      setMessage(msg);
      clearSlowHintTimer();
    };

    if (!isJwtAuthMode()) {
      fail(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      fail(cfg.message);

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (oauthError !== null && oauthError.length > 0) {
      const decoded = decodeOAuthErrorDescription(oauthErrorDescription);
      fail(humanizeAuthorizeCallbackError(oauthError, decoded));

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    if (!code || !state) {
      fail("We did not receive a complete response from your identity provider. Start sign-in again.");

      return () => {
        canceled = true;
        clearSlowHintTimer();
      };
    }

    const stored = consumePkceState();

    if (!stored || stored.state !== state) {
      fail("This sign-in attempt expired or was started in another window. Try signing in again.");

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
        const authority = getOidcAuthority();
        const clientId = getOidcClientId();
        const redirectUri = getOidcRedirectUri();
        const doc = await loadDiscoveryDocument(authority);
        const tokens = await exchangeAuthorizationCode({
          tokenEndpoint: doc.token_endpoint,
          clientId,
          code,
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
            fail("Your identity response could not be verified securely. Try signing in again.");

            return;
          }
        }

        clearLastRegistrationPayload();
        persistTokenResponse(tokens);

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
          fail(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      canceled = true;
      clearSlowHintTimer();
    };
  }, [code, oauthError, oauthErrorDescription, state]);

  if (failed) {
    return authCallbackChrome(
      <AuthCallbackAccessPanel technicalDetail={toBuyerSafeAuthFailureMessage(message)} />,
    );
  }

  return authCallbackChrome(<AuthCallbackLoadingView message={message} showSlowHint={showSlowHint} />);
}
