import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Governance trail for the architecture decision register (GDO). */
export function DecisionRegisterBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="decision-register-breadcrumb"
      items={[
        { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: BUYER_GOVERNANCE_DECISION_REGISTER_TITLE },
      ]}
    />
  );
}
