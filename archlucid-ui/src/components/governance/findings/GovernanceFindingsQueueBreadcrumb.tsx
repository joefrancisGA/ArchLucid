import type { JSX } from "react";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

/** Governance trail for the cross-review findings queue (GFN). */
export function GovernanceFindingsQueueBreadcrumb(): JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-findings-breadcrumb"
      items={[
        { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE },
      ]}
    />
  );
}
