"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { assertOidcSignInConfig, isJwtAuthMode } from "@/lib/oidc/config";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer-safe-auth-messages";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { SessionExpiredEvidenceOrientationStrip } from "@/app/(operator)/auth/session-expired/SessionExpiredEvidenceOrientationStrip";

/**
 * Cleaner, user-facing counterpart to `/auth/signin?reason=idle-timeout&returnUrl=…`.
 * `reason` defaults to "idle-timeout" (the only trigger today — `SessionIdleTimeoutGuard`)
 * but the route also accepts the other recognized session-message reasons for future callers.
 * Never auto-redirects to the IdP; always requires an explicit "Sign in" click.
 */
export function SessionExpiredClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "idle-timeout";
  const rawReturnUrl = searchParams.get("returnUrl") ?? undefined;
  const hasReturnDestination = isSafeReturnPath(rawReturnUrl) && rawReturnUrl !== "/";

  const [error, setError] = useState<string | null>(null);

  const handleSignIn = () => {
    if (!isJwtAuthMode()) {
      setError(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE);

      return;
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      setError(cfg.message);

      return;
    }

    void initiateOidcRedirect(rawReturnUrl).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    });
  };

  if (error) {
    return <AuthErrorPanel message={error} />;
  }

  return (
    <>
      <SessionExpiredView reason={reason} onSignIn={handleSignIn} hasReturnDestination={hasReturnDestination} />
      <SessionExpiredEvidenceOrientationStrip />
    </>
  );
}
