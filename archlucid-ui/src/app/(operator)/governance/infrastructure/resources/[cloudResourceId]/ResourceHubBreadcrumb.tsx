import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

/** Resource evidence hub breadcrumb (GOL). */
export function ResourceHubBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="infra-resource-hub-breadcrumb"
      items={[
        { label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE, href: GOVERNANCE_INFRASTRUCTURE_PATH },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE, href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE },
      ]}
    />
  );
}
