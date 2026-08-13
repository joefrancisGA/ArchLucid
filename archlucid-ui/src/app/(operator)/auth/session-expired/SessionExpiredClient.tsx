"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { assertOidcSignInConfig, isJwtAuthMode } from "@/lib/oidc/config";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer/buyer-safe-auth-messages";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { SESSION_EXPIRED_SIGN_IN_ERROR_TITLE } from "@/lib/auth/session-expired-page-copy";
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
    return (
      <AuthFlowShell showEvaluationSignupLink={false} hasReturnDestination={hasReturnDestination}>
        <AuthErrorPanel
          title={SESSION_EXPIRED_SIGN_IN_ERROR_TITLE}
          message={error}
          onTryAgain={handleSignIn}
        />
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell showEvaluationSignupLink={false} hasReturnDestination={hasReturnDestination}>
      <SessionExpiredView reason={reason} onSignIn={handleSignIn} hasReturnDestination={hasReturnDestination} />
    </AuthFlowShell>
  );
}
