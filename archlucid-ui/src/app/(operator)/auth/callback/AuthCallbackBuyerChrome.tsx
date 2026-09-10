"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import {
  AUTH_CALLBACK_FIRST_VIEWPORT_ID,
  AUTH_CALLBACK_PRIMARY_CONTENT_ID,
  AUTH_CALLBACK_SKIP_LINK_LABEL,
  AUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/auth/auth-callback-page-copy";
import { AUTH_CALLBACK_CLAIM_DISCIPLINE } from "@/lib/auth-callback-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { AuthCallbackClaimOrientationStrip } from "./AuthCallbackClaimOrientationStrip";

type AuthCallbackBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/callback` — skip link, first-viewport band, body, Sources below. */
export function AuthCallbackBuyerChrome({ children }: AuthCallbackBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_CALLBACK_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_CALLBACK_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell
        showEvaluationSignupLink={false}
        afterPanel={
          <div className="mt-4 text-left" data-testid="auth-callback-orientation-bottom">
            <AuthCallbackClaimOrientationStrip />
          </div>
        }
      >
        <div
          id={AUTH_CALLBACK_PRIMARY_CONTENT_ID}
          data-testid="auth-callback-primary-content"
          className="scroll-mt-24 space-y-6"
        >
          <div
            id={AUTH_CALLBACK_FIRST_VIEWPORT_ID}
            data-testid={AUTH_CALLBACK_FIRST_VIEWPORT_ID}
            className={cn(
              "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            )}
          >
            <div data-testid="auth-callback-orientation-top">
              <PageHeaderClaimDiscipline
                text={AUTH_CALLBACK_CLAIM_DISCIPLINE}
                testId="auth-callback-claim-discipline"
                className="text-left"
              />
            </div>
            {children}
          </div>
        </div>
      </AuthFlowShell>
    </>
  );
}
