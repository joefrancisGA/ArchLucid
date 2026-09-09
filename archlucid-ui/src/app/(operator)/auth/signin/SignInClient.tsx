"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { PostAuthBootstrapExitActions } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapExitActions";
import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";
import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { SignInBuyerChrome } from "@/app/(operator)/auth/signin/SignInBuyerChrome";
import { SignInFlowClient } from "@/app/(operator)/auth/signin/SignInFlowClient";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { AUTH_SIGNIN_FATAL_ERROR_TITLE } from "@/lib/auth/auth-signin-page-copy";
import { BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/buyer/buyer-safe-auth-messages";
import { assertOidcSignInConfig, isJwtAuthMode } from "@/lib/oidc/config";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";

export function SignInClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const returnUrl = searchParams.get("returnUrl") ?? undefined;
  const invitationToken =
    searchParams.get("invitationToken") ?? searchParams.get("invitation") ?? undefined;

  const showsSessionMessage = Boolean(reason && reason.length > 0);
  const [sessionRecoveryError, setSessionRecoveryError] = useState<string | null>(null);

  const handleSessionRecoverySignIn = () => {
    if (!isJwtAuthMode()) {
      setSessionRecoveryError(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE);

      return;
    }

    const cfg = assertOidcSignInConfig();

    if (!cfg.ok) {
      setSessionRecoveryError(cfg.message);

      return;
    }

    void initiateOidcRedirect(returnUrl).catch((error: unknown) => {
      setSessionRecoveryError(error instanceof Error ? error.message : String(error));
    });
  };

  if (sessionRecoveryError) {
    return (
      <SignInBuyerChrome showFooterPasswordlessExplanation={false} showFooterHelpLink={false}>
        <AuthErrorPanel
          title={AUTH_SIGNIN_FATAL_ERROR_TITLE}
          message={sessionRecoveryError}
          onTryAgain={handleSessionRecoverySignIn}
        />
        <FatalPageReportProblemSupportRow
          surfaceId="auth-signin-cannot-proceed"
          routePath="/auth/signin"
          errorTitle={AUTH_SIGNIN_FATAL_ERROR_TITLE}
          errorCode="auth-signin-session-recovery-failure"
        />
        <PostAuthBootstrapExitActions />
      </SignInBuyerChrome>
    );
  }

  if (showsSessionMessage) {
    return (
      <SignInBuyerChrome showFooterPasswordlessExplanation={false} showFooterHelpLink={false}>
        <SessionExpiredView
          reason={reason}
          onSignIn={handleSessionRecoverySignIn}
          returnUrl={returnUrl}
        />
      </SignInBuyerChrome>
    );
  }

  return <SignInFlowClient returnUrl={returnUrl} invitationTokenFromQuery={invitationToken} />;
}
