"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  AUTH_CALLBACK_PRIMARY_CONTENT_ID,
  AUTH_CALLBACK_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-callback-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { AuthCallbackBreadcrumb } from "./AuthCallbackBreadcrumb";
import { AuthCallbackClaimOrientationStrip } from "./AuthCallbackClaimOrientationStrip";

type AuthCallbackBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/callback` — skip link, breadcrumb, claim/Sources, body. */
export function AuthCallbackBuyerChrome({ children }: AuthCallbackBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_CALLBACK_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_CALLBACK_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell showEvaluationSignupLink={false}>
        <div
          id={AUTH_CALLBACK_PRIMARY_CONTENT_ID}
          data-testid="auth-callback-primary-content"
          className="scroll-mt-24"
        >
          <div className="mb-4 text-left">
            <AuthCallbackBreadcrumb />
          </div>
          <div className="mb-6 text-left" data-testid="auth-callback-orientation-top">
            <AuthCallbackClaimOrientationStrip />
          </div>
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
