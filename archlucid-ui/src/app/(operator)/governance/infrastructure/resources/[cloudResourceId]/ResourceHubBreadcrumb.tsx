"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { infrastructureOverviewPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";

/** Resource evidence hub breadcrumb (GOL / ICL). */
export function ResourceHubBreadcrumb(): React.JSX.Element {
  const { productLine } = useProductLine();
  const infrastructureOverviewPath = infrastructureOverviewPathForProductLine(productLine);
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);

  return (
    <OperatorPageBreadcrumb
      data-testid="infra-resource-hub-breadcrumb"
      items={[
        { label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE, href: infrastructureOverviewPath },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE, href: resourcesPath },
        { label: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE },
      ]}
    />
  );
}
