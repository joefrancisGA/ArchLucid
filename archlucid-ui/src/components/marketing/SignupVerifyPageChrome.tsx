import type { ReactNode } from "react";

import { SignupVerifyEvidenceOrientationStrip } from "@/components/marketing/SignupVerifyEvidenceOrientationStrip";
import { SignupVerifyBreadcrumb } from "@/components/marketing/signup/SignupVerifyBreadcrumb";
import {
  SIGNUP_VERIFY_PRIMARY_CONTENT_ID,
  SIGNUP_VERIFY_SKIP_LINK_LABEL,
} from "@/lib/marketing/signup-verify-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type SignupVerifyPageChromeProps = {
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/signup/verify` — skip link, breadcrumb, claim/Sources, verification card. */
export function SignupVerifyPageChrome(props: SignupVerifyPageChromeProps): React.JSX.Element {
  const { children } = props;

  return (
    <>
      <a href={`#${SIGNUP_VERIFY_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {SIGNUP_VERIFY_SKIP_LINK_LABEL}
      </a>

      <div className="mb-4 text-left">
        <SignupVerifyBreadcrumb />
      </div>

      <div className="mb-6 text-left" data-testid="signup-verify-orientation-top">
        <SignupVerifyEvidenceOrientationStrip />
      </div>

      <div
        id={SIGNUP_VERIFY_PRIMARY_CONTENT_ID}
        data-testid="signup-verify-primary-content"
        className="scroll-mt-24"
      >
        {children}
      </div>
    </>
  );
}
