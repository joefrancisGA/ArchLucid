"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  SESSION_EXPIRED_PRIMARY_CONTENT_ID,
  SESSION_EXPIRED_SKIP_LINK_LABEL,
} from "@/lib/auth/session-expired-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { SessionExpiredBreadcrumb } from "./SessionExpiredBreadcrumb";
import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

type SessionExpiredBuyerChromeProps = {
  readonly children: ReactNode;
  readonly hasReturnDestination?: boolean;
};

/** Shared buyer-facing chrome for `/auth/session-expired` — skip link, breadcrumb, claim/Sources, body. */
export function SessionExpiredBuyerChrome({
  children,
  hasReturnDestination = false,
}: SessionExpiredBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${SESSION_EXPIRED_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {SESSION_EXPIRED_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell showEvaluationSignupLink={false} hasReturnDestination={hasReturnDestination}>
        <div
          id={SESSION_EXPIRED_PRIMARY_CONTENT_ID}
          data-testid="session-expired-primary-content"
          className="scroll-mt-24"
        >
          <div className="mb-4 text-left">
            <SessionExpiredBreadcrumb />
          </div>
          <div className="mb-6 text-left" data-testid="session-expired-orientation-top">
            <SessionExpiredClaimOrientationStrip />
          </div>
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
