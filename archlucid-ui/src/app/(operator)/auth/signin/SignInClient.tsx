"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { SignInBuyerChrome } from "@/app/(operator)/auth/signin/SignInBuyerChrome";
import { SignInFlowClient } from "@/app/(operator)/auth/signin/SignInFlowClient";

export function SignInClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const returnUrl = searchParams.get("returnUrl") ?? undefined;
  const invitationToken =
    searchParams.get("invitationToken") ?? searchParams.get("invitation") ?? undefined;

  const showsSessionMessage = Boolean(reason && reason.length > 0);
  const [sessionAcknowledged, setSessionAcknowledged] = useState(false);

  if (showsSessionMessage && !sessionAcknowledged) {
    return (
      <SignInBuyerChrome showFooterPasswordlessExplanation={false} showFooterHelpLink={false}>
        <SessionExpiredView
          reason={reason}
          onSignIn={() => {
            setSessionAcknowledged(true);
          }}
          returnUrl={returnUrl}
        />
      </SignInBuyerChrome>
    );
  }

  return <SignInFlowClient returnUrl={returnUrl} invitationTokenFromQuery={invitationToken} />;
}
