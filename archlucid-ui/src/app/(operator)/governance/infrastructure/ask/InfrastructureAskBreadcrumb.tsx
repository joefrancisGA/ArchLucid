import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

/** Infrastructure Ask breadcrumb (GOS). */
export function InfrastructureAskBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="infra-ask-breadcrumb"
      items={[
        { label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE, href: GOVERNANCE_INFRASTRUCTURE_PATH },
        { label: GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE },
      ]}
    />
  );
}
