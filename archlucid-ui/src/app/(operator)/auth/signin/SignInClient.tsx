"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { assertOidcSignInConfig, isJwtAuthMode } from "@/lib/oidc/config";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer-safe-auth-messages";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";

const REDIRECT_FALLBACK_MS = 8000;

export function SignInClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const returnUrl = searchParams.get("returnUrl") ?? undefined;

  // Any non-empty `reason` means the user landed here from a sign-out/expiry event rather
  // than a plain sign-in link — show an explanatory message instead of auto-redirecting.
  // Unrecognized reason values still render (with safe generic copy) rather than falling
  // through to a silent auto-redirect loop.
  const showsSessionMessage = Boolean(reason && reason.length > 0);
  const hasReturnDestination = isSafeReturnPath(returnUrl) && returnUrl !== "/";

  const [error, setError] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (showsSessionMessage) {
      return;
    }

    const t = window.setTimeout(() => {
      setShowSlowHint(true);
    }, REDIRECT_FALLBACK_MS);

    return () => {
      window.clearTimeout(t);
    };
  }, [showsSessionMessage]);

  useEffect(() => {
    if (showsSessionMessage) {
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
  }, [showsSessionMessage, returnUrl]);

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
    return <AuthErrorPanel message={error} />;
  }

  if (showsSessionMessage) {
    return (
      <SessionExpiredView
        reason={reason}
        onSignIn={handleSessionExpiredSignIn}
        hasReturnDestination={hasReturnDestination}
      />
    );
  }

  return (
    <div className="max-w-[560px]">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Signing in</h2>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Secure access to architecture review packages, evidence-linked findings, and governance exports for your organization.
      </p>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Redirecting to your identity provider…</p>
      {showSlowHint ? (
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Taking longer than expected?{" "}
          <Link className={OPERATOR_LINK.nav} href="/auth/signin">
            Try again
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.nav} href="/settings/support">
            Contact your administrator
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
