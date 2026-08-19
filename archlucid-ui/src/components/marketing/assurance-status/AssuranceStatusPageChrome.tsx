import type { ReactNode } from "react";

import { SecurityTrustEvidenceOrientationStrip } from "@/components/marketing/SecurityTrustEvidenceOrientationStrip";
import {
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
  ASSURANCE_STATUS_SKIP_LINK_LABEL,
} from "@/lib/marketing/assurance-status-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type AssuranceStatusPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/assurance-status` — skip link, hero, Sources orientation, primary body. */
export function AssuranceStatusPageChrome(props: AssuranceStatusPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${ASSURANCE_STATUS_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {ASSURANCE_STATUS_SKIP_LINK_LABEL}
      </a>

      {hero}

      <div className="mb-6" data-testid="assurance-status-orientation-top">
        <SecurityTrustEvidenceOrientationStrip />
      </div>

      <div
        id={ASSURANCE_STATUS_PRIMARY_CONTENT_ID}
        data-testid="assurance-status-primary-content"
        className="scroll-mt-24 space-y-12"
      >
        {children}
      </div>
    </>
  );
}
