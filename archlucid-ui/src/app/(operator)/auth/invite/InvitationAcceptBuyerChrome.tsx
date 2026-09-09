"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import {
  AUTH_INVITE_FIRST_VIEWPORT_ID,
  AUTH_INVITE_PRIMARY_CONTENT_ID,
  AUTH_INVITE_SKIP_LINK_LABEL,
  AUTH_INVITE_SKIP_TARGET_ID,
} from "@/lib/auth/auth-invite-page-copy";
import { AUTH_INVITE_CLAIM_DISCIPLINE } from "@/lib/auth-invite-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { InvitationAcceptClaimOrientationStrip } from "./InvitationAcceptClaimOrientationStrip";

type InvitationAcceptBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/invite` — skip link, first-viewport band, step body, Sources below. */
export function InvitationAcceptBuyerChrome({ children }: InvitationAcceptBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_INVITE_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_INVITE_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell
        showEvaluationSignupLink={false}
        afterPanel={
          <div className="mt-4 text-left" data-testid="auth-invite-orientation-bottom">
            <InvitationAcceptClaimOrientationStrip />
          </div>
        }
      >
        <div
          id={AUTH_INVITE_PRIMARY_CONTENT_ID}
          data-testid="auth-invite-primary-content"
          className="scroll-mt-24 space-y-6"
        >
          <div
            id={AUTH_INVITE_FIRST_VIEWPORT_ID}
            data-testid={AUTH_INVITE_FIRST_VIEWPORT_ID}
            className={cn(
              "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            )}
          >
            <div data-testid="auth-invite-orientation-top">
              <PageHeaderClaimDiscipline
                text={AUTH_INVITE_CLAIM_DISCIPLINE}
                testId="auth-invite-claim-discipline"
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
