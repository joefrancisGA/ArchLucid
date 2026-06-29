"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  assertOidcSignInConfig,
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
  getOidcScopes,
  isJwtAuthMode,
} from "@/lib/oidc/config";
import { buildAuthorizeUrl } from "@/lib/oidc/build-authorize-url";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { createPkcePair, randomOpaqueState } from "@/lib/oidc/pkce";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer-safe-auth-messages";
import { isLikelySignedIn, storePkceState, storePostSignInReturnUrl } from "@/lib/oidc/session";
import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";

/**
 * Starts OIDC authorization code + PKCE against NEXT_PUBLIC_OIDC_* (Entra or any OIDC provider).
 */
const REDIRECT_FALLBACK_MS = 8000;

/**
 * Builds the IdP authorization URL and navigates the browser to it.
 * Stores PKCE state and an optional post-sign-in return URL before redirecting.
 * @param returnUrl - Relative URL to restore after successful sign-in (must start with "/").
 */
async function initiateOidcRedirect(returnUrl?: string): Promise<void> {
  const authority = getOidcAuthority();
  const clientId = getOidcClientId();
  const redirectUri = getOidcRedirectUri();
  const scope = getOidcScopes();
  const { verifier, challenge } = await createPkcePair();
  const state = randomOpaqueState();
  const nonce = randomOpaqueState();

  storePkceState(state, verifier, nonce);

  if (returnUrl) {
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

export function SignInClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const returnUrl = searchParams.get("returnUrl") ?? undefined;

  const isIdleTimeout = reason === "idle-timeout";

  const [error, setError] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (isIdleTimeout) {
      return;
    }

    const t = window.setTimeout(() => {
      setShowSlowHint(true);
    }, REDIRECT_FALLBACK_MS);

    return () => {
      window.clearTimeout(t);
    };
  }, [isIdleTimeout]);

  useEffect(() => {
    if (isIdleTimeout) {
      return;
    }

    if (!isJwtAuthMode()) {
      setError(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE);

      return;
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      setError(cfg.message);

      return;
    }

    if (isLikelySignedIn()) {
      window.location.replace("/");

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await initiateOidcRedirect(returnUrl);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isIdleTimeout, returnUrl]);

  const handleSessionExpiredSignIn = () => {
    if (!isJwtAuthMode()) {
      setError(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE);

      return;
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      setError(cfg.message);

      return;
    }

    void initiateOidcRedirect(returnUrl).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
  };

  if (error) {
    return (
      <div className="max-w-[560px]">
        <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Access request</h2>
        <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{error}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button asChild variant="default" size="sm">
            <Link href="/auth/signin">Try again</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/help">Help</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isIdleTimeout) {
    return <SessionExpiredView onSignIn={handleSessionExpiredSignIn} />;
  }

  return (
    <div className="max-w-[560px]">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Signing in</h2>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Redirecting to your identity provider…</p>
      {showSlowHint ? (
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Taking longer than expected?{" "}
          <Link className={OPERATOR_LINK.nav} href="/auth/signin">
            Try again
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
