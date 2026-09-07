import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";

/** Infrastructure overview hub breadcrumb (GOI). */
export function InfrastructureOverviewBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-infrastructure-overview-breadcrumb"
      items={[{ label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE }]}
    />
  );
}
