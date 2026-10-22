"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

/** Infrastructure Ask breadcrumb (GOS). SecureNow uses the sidebar label. */
export function InfrastructureAskBreadcrumb(): React.JSX.Element {
  const { productLine } = useProductLine();
  const secureNow = productLine === "security";
  const currentLabel = secureNow
    ? SECURENOW_NAV_LABELS["/infrastructure/ask"] ?? GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE
    : GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE;
  const parentLabel = secureNow
    ? SECURENOW_NAV_LABELS["/"] ?? "Home"
    : GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE;
  const parentHref = secureNow ? "/" : GOVERNANCE_INFRASTRUCTURE_PATH;

  return (
    <OperatorPageBreadcrumb
      data-testid="infra-ask-breadcrumb"
      items={[
        { label: parentLabel, href: parentHref },
        { label: currentLabel },
      ]}
    />
  );
}
