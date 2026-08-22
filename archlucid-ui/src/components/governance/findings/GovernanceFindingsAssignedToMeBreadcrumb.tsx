import type { JSX } from "react";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

/** Three-level trail for the personal assigned-to-me findings queue. */
export function GovernanceFindingsAssignedToMeBreadcrumb(): JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-assigned-to-me-breadcrumb"
      items={[
        { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
        { label: "Assigned to me" },
      ]}
    />
  );
}
