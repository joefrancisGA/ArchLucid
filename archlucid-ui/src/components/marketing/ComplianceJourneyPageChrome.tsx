import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ComplianceJourneyClaimOrientationStrip } from "@/components/marketing/compliance-journey/ComplianceJourneyClaimOrientationStrip";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import {
  COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID,
  COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
  COMPLIANCE_JOURNEY_SKIP_LINK_LABEL,
  COMPLIANCE_JOURNEY_SKIP_TARGET_ID,
} from "@/lib/compliance-journey-page-copy";
import { COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE } from "@/lib/compliance-journey-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type ComplianceJourneyPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/compliance-journey` — skip link, hero, first-viewport orientation, primary body. */
export function ComplianceJourneyPageChrome(props: ComplianceJourneyPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${COMPLIANCE_JOURNEY_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {COMPLIANCE_JOURNEY_SKIP_LINK_LABEL}
      </a>

      <div
        id={COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID}
        data-testid="compliance-journey-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {hero}

        <div
          id={COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID}
          data-testid={COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-12 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <div data-testid="compliance-journey-orientation-top">
            <PageHeaderClaimDiscipline
              text={COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE}
              testId="compliance-journey-claim-discipline"
              className="max-w-prose text-left"
            />
            <ComplianceJourneyClaimOrientationStrip />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
