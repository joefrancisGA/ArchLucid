"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import {
  AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID,
  AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
  AUTH_BOOTSTRAP_SKIP_LINK_LABEL,
  AUTH_BOOTSTRAP_SKIP_TARGET_ID,
} from "@/lib/auth/auth-bootstrap-page-copy";
import { AUTH_BOOTSTRAP_CLAIM_DISCIPLINE } from "@/lib/auth-bootstrap-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { PostAuthBootstrapClaimOrientationStrip } from "./PostAuthBootstrapClaimOrientationStrip";

type PostAuthBootstrapBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/bootstrap` — skip link, first-viewport band, step body, Sources below. */
export function PostAuthBootstrapBuyerChrome({ children }: PostAuthBootstrapBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_BOOTSTRAP_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_BOOTSTRAP_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell
        showEvaluationSignupLink={false}
        afterPanel={
          <div className="mt-4 text-left" data-testid="post-auth-bootstrap-orientation-bottom">
            <PostAuthBootstrapClaimOrientationStrip />
          </div>
        }
      >
        <div
          id={AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID}
          data-testid="post-auth-bootstrap-primary-content"
          className="scroll-mt-24 space-y-6"
        >
          <div
            id={AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID}
            data-testid={AUTH_BOOTSTRAP_FIRST_VIEWPORT_ID}
            className={cn(
              "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            )}
          >
            <div data-testid="post-auth-bootstrap-orientation-top">
              <PageHeaderClaimDiscipline
                text={AUTH_BOOTSTRAP_CLAIM_DISCIPLINE}
                testId="post-auth-bootstrap-claim-discipline"
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
