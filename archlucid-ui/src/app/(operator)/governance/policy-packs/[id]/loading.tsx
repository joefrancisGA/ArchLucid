import { GovernancePolicyPackBreadcrumb } from "@/components/governance/GovernancePolicyPackBreadcrumb";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import {
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";
import { BUYER_POLICY_PACK_LEAD } from "@/lib/buyer/buyer-polish-copy";

import { PolicyPackDetailLoadingSkeleton } from "./PolicyPackDetailLoadingSkeleton";

/** Short-lived navigation shell for policy pack detail — structured chrome (not a bare loading line). */
export default function PolicyPackDetailLoading(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="policy-pack-detail-route-loading">
      <a
        href={`#${POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {POLICY_PACK_DETAIL_SKIP_LINK_LABEL}
      </a>
      <LayerHeader pageKey="policy-packs" density="compact" className="px-4" />
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack}>
        <OperatorPageHeader
          navHref={GOVERNANCE_POLICY_PACKS_PATH}
          title="Policy pack detail"
          headingLevel="h1"
          subtitle={BUYER_POLICY_PACK_LEAD}
          claimDiscipline={POLICY_PACK_DETAIL_CLAIM_DISCIPLINE}
          claimDisciplineTestId="policy-pack-detail-claim-discipline"
          breadcrumb={<GovernancePolicyPackBreadcrumb packLabel="Policy pack" />}
        />
        <PolicyPackDetailLoadingSkeleton />
      </OperatorPageContainer>
    </div>
  );
}
