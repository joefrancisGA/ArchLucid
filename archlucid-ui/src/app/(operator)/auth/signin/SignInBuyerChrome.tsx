"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  AUTH_SIGNIN_PRIMARY_CONTENT_ID,
  AUTH_SIGNIN_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-signin-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { SignInClaimOrientationStrip } from "./SignInClaimOrientationStrip";

type SignInBuyerChromeProps = {
  readonly children: ReactNode;
  readonly hasReturnDestination?: boolean;
  readonly showFooterPasswordlessExplanation?: boolean;
  readonly showFooterHelpLink?: boolean;
};

/** Shared buyer-facing chrome for `/auth/signin` — skip link, sign-in body, Sources below. */
export function SignInBuyerChrome({
  children,
  hasReturnDestination = false,
  showFooterPasswordlessExplanation = true,
  showFooterHelpLink = true,
}: SignInBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_SIGNIN_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_SIGNIN_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell
        hasReturnDestination={hasReturnDestination}
        showFooterPasswordlessExplanation={showFooterPasswordlessExplanation}
        showFooterHelpLink={showFooterHelpLink}
        afterPanel={
          <div className="mt-4 text-left" data-testid="auth-signin-orientation-bottom">
            <SignInClaimOrientationStrip />
          </div>
        }
      >
        <div
          id={AUTH_SIGNIN_PRIMARY_CONTENT_ID}
          data-testid="auth-signin-primary-content"
          className="scroll-mt-24"
        >
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
