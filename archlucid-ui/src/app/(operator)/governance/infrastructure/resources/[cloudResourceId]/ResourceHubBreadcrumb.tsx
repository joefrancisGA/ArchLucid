"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";

/** Resource evidence hub breadcrumb (GOL). */
export function ResourceHubBreadcrumb(): React.JSX.Element {
  const { productLine } = useProductLine();
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);

  return (
    <OperatorPageBreadcrumb
      data-testid="infra-resource-hub-breadcrumb"
      items={[
        { label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE, href: GOVERNANCE_INFRASTRUCTURE_PATH },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE, href: resourcesPath },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE },
      ]}
    />
  );
}
