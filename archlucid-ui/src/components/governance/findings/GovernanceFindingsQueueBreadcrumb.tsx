import type { JSX } from "react";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { policyPacksPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

/** Governance trail for the cross-review findings queue (GFN). */
export function GovernanceFindingsQueueBreadcrumb(props: {
  readonly productLine?: ProductLineId;
}): JSX.Element {
  const productLine = props.productLine ?? "architecture";
  const complianceProductLine = productLine === "security";

  return (
    <OperatorPageBreadcrumb
      data-testid="governance-findings-breadcrumb"
      items={[
        {
          label: complianceProductLine ? "Compliance" : "Approval",
          href: complianceProductLine
            ? policyPacksPathForProductLine(productLine)
            : GOVERNANCE_APPROVAL_QUEUE_PATH,
        },
        { label: BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE },
      ]}
    />
  );
}
