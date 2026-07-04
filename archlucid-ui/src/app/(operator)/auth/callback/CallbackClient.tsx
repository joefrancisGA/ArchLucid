"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer-safe-auth-messages";
import {
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
} from "@/lib/oidc/oauth-callback-messages";
import { consumePkceState, persistTokenResponse, consumePostSignInReturnUrl } from "@/lib/oidc/session";
import { clearLastRegistrationPayload } from "@/lib/registration-session";

/** Matches `SignInClient` — token exchange can be slow on cold IdP or corporate proxies. */
const TOKEN_EXCHANGE_SLOW_HINT_MS = 8000;

const CALLBACK_LOADING_DETAIL = "Checking your authorization and securing your session…";

/**
 * OAuth2 authorization-code callback: exchanges ?code= for tokens (PKCE, public client).
 */
export function CallbackClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>(CALLBACK_LOADING_DETAIL);
  const [failed, setFailed] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    let cancelled = false;

    /** Browser timer id — use `number` so Node’s `Timeout` typing does not clash with `window.setTimeout`. */
    let slowHintTimer: number | undefined;

    const clearSlowHintTimer = () => {
      if (slowHintTimer !== undefined) {
        window.clearTimeout(slowHintTimer);
        slowHintTimer = undefined;
      }
    };

    const fail = (msg: string) => {
      if (cancelled) {
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
        cancelled = true;
        clearSlowHintTimer();
      };
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      fail(cfg.message);

      return () => {
        cancelled = true;
        clearSlowHintTimer();
      };
    }

    if (oauthError !== null && oauthError.length > 0) {
      const decoded = decodeOAuthErrorDescription(oauthErrorDescription);
      fail(humanizeAuthorizeCallbackError(oauthError, decoded));

      return () => {
        cancelled = true;
        clearSlowHintTimer();
      };
    }

    if (!code || !state) {
      fail("We did not receive a complete response from your identity provider. Start sign-in again.");

      return () => {
        cancelled = true;
        clearSlowHintTimer();
      };
    }

    const stored = consumePkceState();

    if (!stored || stored.state !== state) {
      fail("This sign-in attempt expired or was started in another window. Try signing in again.");

      return () => {
        cancelled = true;
        clearSlowHintTimer();
      };
    }

    void (async () => {
      slowHintTimer = window.setTimeout(() => {
        if (!cancelled) {
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

        if (cancelled) {
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

        window.location.replace(returnUrl ?? "/");
      } catch (e) {
        clearSlowHintTimer();

        if (!cancelled) {
          fail(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
      clearSlowHintTimer();
    };
  }, [code, oauthError, oauthErrorDescription, state]);

  if (failed) {
    return <AuthErrorPanel title="Sign-in could not finish" message={message} />;
  }

  return (
    <div className="max-w-[560px]">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Completing sign-in</h2>

      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn("mt-3", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}
      >
        <p className="m-0">{message}</p>

        {showSlowHint ? (
          <p className="m-0 mt-3">
            Taking longer than expected?{" "}
            <Link className={OPERATOR_LINK.nav} href="/auth/signin">
              Restart sign-in
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
