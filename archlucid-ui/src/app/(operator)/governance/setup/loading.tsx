import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  GOVERNANCE_SETUP_HREF,
  GOVERNANCE_SETUP_PAGE_TITLE,
} from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_SETUP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-setup-evidence-copy";
import {
  GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER,
  GOVERNANCE_SETUP_PRIMARY_CONTENT_ID,
  GOVERNANCE_SETUP_SKIP_LINK_LABEL,
} from "@/lib/governance-setup-page-copy";

import { GovernanceSetupLoadingSkeleton } from "./_sections/GovernanceSetupLoadingSkeleton";

/** Short-lived navigation shell for approval setup (GFX). */
export default function GovernanceSetupLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 px-1 py-4 sm:px-0" data-testid="governance-setup-route-loading">
      <a
        href={`#${GOVERNANCE_SETUP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_SETUP_SKIP_LINK_LABEL}
      </a>
      <OperatorPageHeader
        navHref={GOVERNANCE_SETUP_HREF}
        title={GOVERNANCE_SETUP_PAGE_TITLE}
        subtitle={GOVERNANCE_SETUP_PAGE_SUBTITLE_BUYER}
        claimDiscipline={GOVERNANCE_SETUP_CLAIM_DISCIPLINE}
        claimDisciplineTestId="governance-setup-claim-discipline"
      />
      <GovernanceSetupLoadingSkeleton />
    </div>
  );
}
