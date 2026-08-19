import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { POLICY_PACKS_PAGE_TITLE } from "@/lib/policy/policy-packs-page";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Governance trail for the policy packs hub (GPP). */
export function PolicyPacksBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="policy-packs-breadcrumb"
      items={[
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: POLICY_PACKS_PAGE_TITLE },
      ]}
    />
  );
}
