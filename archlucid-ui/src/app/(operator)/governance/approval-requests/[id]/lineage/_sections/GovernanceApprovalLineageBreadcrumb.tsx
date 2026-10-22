import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Governance trail for approval lineage detail (GAI). */
export function GovernanceApprovalLineageBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="approval-lineage-page-breadcrumb"
      items={[
        { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: "Approval lineage" },
      ]}
    />
  );
}
