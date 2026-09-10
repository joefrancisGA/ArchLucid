"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import {
  SESSION_EXPIRED_FIRST_VIEWPORT_ID,
  SESSION_EXPIRED_PRIMARY_CONTENT_ID,
  SESSION_EXPIRED_SKIP_LINK_LABEL,
  SESSION_EXPIRED_SKIP_TARGET_ID,
} from "@/lib/auth/session-expired-page-copy";
import { SESSION_EXPIRED_CLAIM_DISCIPLINE } from "@/lib/session-expired-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { SessionExpiredClaimOrientationStrip } from "./SessionExpiredClaimOrientationStrip";

type SessionExpiredBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/session-expired` — skip link, first-viewport band, recovery body, Sources below. */
export function SessionExpiredBuyerChrome({ children }: SessionExpiredBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${SESSION_EXPIRED_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
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
          className="scroll-mt-24 space-y-6"
        >
          <div
            id={SESSION_EXPIRED_FIRST_VIEWPORT_ID}
            data-testid={SESSION_EXPIRED_FIRST_VIEWPORT_ID}
            className={cn(
              "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            )}
          >
            <div data-testid="session-expired-orientation-top">
              <PageHeaderClaimDiscipline
                text={SESSION_EXPIRED_CLAIM_DISCIPLINE}
                testId="session-expired-claim-discipline"
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
