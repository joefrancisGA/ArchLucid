"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  AUTH_INVITE_PRIMARY_CONTENT_ID,
  AUTH_INVITE_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-invite-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { InvitationAcceptBreadcrumb } from "./InvitationAcceptBreadcrumb";
import { InvitationAcceptClaimOrientationStrip } from "./InvitationAcceptClaimOrientationStrip";

type InvitationAcceptBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/invite` — skip link, breadcrumb, step body, Sources below. */
export function InvitationAcceptBuyerChrome({ children }: InvitationAcceptBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_INVITE_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
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
          className="scroll-mt-24"
        >
          <div className="mb-4 text-left">
            <InvitationAcceptBreadcrumb />
          </div>
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
