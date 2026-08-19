import type { ReactNode } from "react";

import { ComplianceJourneyClaimOrientationStrip } from "@/components/marketing/compliance-journey/ComplianceJourneyClaimOrientationStrip";
import {
  COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
  COMPLIANCE_JOURNEY_SKIP_LINK_LABEL,
} from "@/lib/compliance-journey-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type ComplianceJourneyPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/compliance-journey` — skip link, hero, claim/Sources, primary body. */
export function ComplianceJourneyPageChrome(props: ComplianceJourneyPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {COMPLIANCE_JOURNEY_SKIP_LINK_LABEL}
      </a>

      {hero}

      <div data-testid="compliance-journey-orientation-top">
        <ComplianceJourneyClaimOrientationStrip />
      </div>

      <div
        id={COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID}
        data-testid="compliance-journey-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {children}
      </div>
    </>
  );
}
