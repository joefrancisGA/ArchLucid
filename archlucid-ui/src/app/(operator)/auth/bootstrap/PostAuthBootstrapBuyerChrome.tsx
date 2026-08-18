"use client";

import type { ReactNode } from "react";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import {
  AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID,
  AUTH_BOOTSTRAP_SKIP_LINK_LABEL,
} from "@/lib/auth/auth-bootstrap-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { PostAuthBootstrapBreadcrumb } from "./PostAuthBootstrapBreadcrumb";
import { PostAuthBootstrapClaimOrientationStrip } from "./PostAuthBootstrapClaimOrientationStrip";

type PostAuthBootstrapBuyerChromeProps = {
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/auth/bootstrap` — skip link, breadcrumb, claim/Sources, step body. */
export function PostAuthBootstrapBuyerChrome({ children }: PostAuthBootstrapBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {AUTH_BOOTSTRAP_SKIP_LINK_LABEL}
      </a>
      <AuthFlowShell showEvaluationSignupLink={false}>
        <div
          id={AUTH_BOOTSTRAP_PRIMARY_CONTENT_ID}
          data-testid="post-auth-bootstrap-primary-content"
          className="scroll-mt-24"
        >
          <div className="mb-4 text-left">
            <PostAuthBootstrapBreadcrumb />
          </div>
          <div className="mb-6 text-left" data-testid="post-auth-bootstrap-orientation-top">
            <PostAuthBootstrapClaimOrientationStrip />
          </div>
          {children}
        </div>
      </AuthFlowShell>
    </>
  );
}
