"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  SESSION_EXPIRED_PRIMARY_CONTENT_ID,
  SESSION_EXPIRED_SKIP_LINK_LABEL,
} from "@/lib/auth/session-expired-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

type SessionExpiredBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/session-expired` — skip link, recovery body, Sources below. */
export function SessionExpiredBuyerChrome({ children }: SessionExpiredBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${SESSION_EXPIRED_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {SESSION_EXPIRED_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell
        showEvaluationSignupLink={false}
        showFooterPasswordlessExplanation={false}
        showFooterHelpLink={false}
        afterPanel={
          <div className="mt-4 text-left" data-testid="session-expired-orientation-bottom">
            <SessionExpiredClaimOrientationStrip />
          </div>
        }
      >
        <div
          id={SESSION_EXPIRED_PRIMARY_CONTENT_ID}
          data-testid="session-expired-primary-content"
          className="scroll-mt-24"
        >
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
