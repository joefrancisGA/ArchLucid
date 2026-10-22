import type { ReactNode } from "react";

import {
  SIGNUP_PRIMARY_CONTENT_ID,
  SIGNUP_SKIP_LINK_LABEL,
} from "@/lib/marketing/signup-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type SignupPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/signup` — skip link, hero, primary signup body. */
export function SignupPageChrome(props: SignupPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${SIGNUP_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {SIGNUP_SKIP_LINK_LABEL}
      </a>

      {hero}

      <div
        id={SIGNUP_PRIMARY_CONTENT_ID}
        data-testid="signup-primary-content"
        className="scroll-mt-24 space-y-8"
      >
        {children}
      </div>
    </>
  );
}
