import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

import { DecisionRegisterBreadcrumb } from "./_sections/DecisionRegisterBreadcrumb";
import { DecisionRegisterLoadingSkeleton } from "./_sections/DecisionRegisterLoadingSkeleton";
import { DECISION_REGISTER_PAGE_SUBTITLE } from "./decision-register-copy";

export default function DecisionRegisterLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="decision-register-route-loading">
      <OperatorPageHeader
        navHref={GOVERNANCE_DECISION_REGISTER_PATH}
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={DECISION_REGISTER_PAGE_SUBTITLE}
        breadcrumb={<DecisionRegisterBreadcrumb />}
      />
      <DecisionRegisterLoadingSkeleton />
    </div>
  );
}
