import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { LayerHeader } from "@/components/LayerHeader";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_POLICY_PACKS_PRIMARY_CONTENT_ID,
  GOVERNANCE_POLICY_PACKS_SKIP_LINK_LABEL,
} from "@/lib/governance-policy-packs-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  BUYER_POLICY_PACKS_PAGE_SUBTITLE,
  POLICY_PACKS_PAGE_TITLE,
} from "@/lib/policy/policy-packs-page";
import { POLICY_PACKS_HUB_CLAIM_DISCIPLINE } from "@/lib/policy/policy-packs-hub-evidence-copy";

import { PolicyPacksBreadcrumb } from "./_sections/PolicyPacksBreadcrumb";
import { PolicyPacksLoadingSkeleton } from "./_sections/PolicyPacksLoadingSkeleton";

export default function GovernancePolicyPacksLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="policy-packs-route-loading">
      <a
        href={`#${GOVERNANCE_POLICY_PACKS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_POLICY_PACKS_SKIP_LINK_LABEL}
      </a>
      <LayerHeader pageKey="policy-packs" density="compact" />
      <OperatorPageHeader
        navHref={GOVERNANCE_POLICY_PACKS_PATH}
        title={POLICY_PACKS_PAGE_TITLE}
        subtitle={BUYER_POLICY_PACKS_PAGE_SUBTITLE}
        claimDiscipline={POLICY_PACKS_HUB_CLAIM_DISCIPLINE}
        claimDisciplineTestId="policy-packs-claim-discipline"
        breadcrumb={<PolicyPacksBreadcrumb />}
      />
      <PolicyPacksLoadingSkeleton />
    </div>
  );
}
