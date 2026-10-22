import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { LayerHeader } from "@/components/LayerHeader";
import { GovernanceStandardsRulesBreadcrumb } from "@/components/governance/GovernanceStandardsRulesBreadcrumb";
import {
  GOVERNANCE_STANDARDS_RULES_PAGE_SUBTITLE_BUYER,
  GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID,
  GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL,
} from "@/lib/governance-standards-rules-page-copy";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { STANDARDS_RULES_CLAIM_DISCIPLINE } from "@/lib/standards-rules-evidence-copy";
import { STANDARDS_RULES_PAGE_TITLE } from "@/lib/standards-rules-page";

import { StandardsRulesLoadingSkeleton } from "./_sections/StandardsRulesLoadingSkeleton";

/** Structured navigation shell while the standards-and-rules client chunk loads. */
export default function GovernanceResolutionLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="standards-rules-route-loading">
      <a
        href={`#${GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL}
      </a>
      <LayerHeader pageKey="governance-resolution" density="compact" />
      <OperatorPageHeader
        navHref={GOVERNANCE_STANDARDS_AND_RULES_PATH}
        title={STANDARDS_RULES_PAGE_TITLE}
        subtitle={GOVERNANCE_STANDARDS_RULES_PAGE_SUBTITLE_BUYER}
        claimDiscipline={STANDARDS_RULES_CLAIM_DISCIPLINE}
        claimDisciplineTestId="standards-rules-claim-discipline"
        breadcrumb={<GovernanceStandardsRulesBreadcrumb />}
      />
      <StandardsRulesLoadingSkeleton />
    </div>
  );
}
