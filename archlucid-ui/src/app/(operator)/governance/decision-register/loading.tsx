import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { DECISION_REGISTER_CLAIM_DISCIPLINE } from "@/lib/decision-register-evidence-copy";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID,
  GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL,
} from "@/lib/governance-decision-register-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { DecisionRegisterBreadcrumb } from "./_sections/DecisionRegisterBreadcrumb";
import { DecisionRegisterLoadingSkeleton } from "./_sections/DecisionRegisterLoadingSkeleton";
import { DECISION_REGISTER_PAGE_SUBTITLE_BUYER } from "./decision-register-copy";

export default function DecisionRegisterLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="decision-register-route-loading">
      <a
        href={`#${GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL}
      </a>
      <OperatorPageHeader
        navHref={GOVERNANCE_DECISION_REGISTER_PATH}
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={DECISION_REGISTER_PAGE_SUBTITLE_BUYER}
        claimDiscipline={DECISION_REGISTER_CLAIM_DISCIPLINE}
        claimDisciplineTestId="decision-register-claim-discipline"
        breadcrumb={<DecisionRegisterBreadcrumb />}
      />
      <DecisionRegisterLoadingSkeleton />
    </div>
  );
}
