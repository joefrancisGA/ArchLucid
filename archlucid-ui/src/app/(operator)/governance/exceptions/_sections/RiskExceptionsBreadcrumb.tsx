import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { BUYER_RISK_EXCEPTIONS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Governance trail for the risk exceptions register (GRO). */
export function RiskExceptionsBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="risk-exceptions-breadcrumb"
      items={[
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: BUYER_RISK_EXCEPTIONS_PAGE_TITLE },
      ]}
    />
  );
}
