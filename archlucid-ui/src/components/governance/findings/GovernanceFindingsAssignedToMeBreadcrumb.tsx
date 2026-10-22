"use client";

import type { JSX } from "react";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

/** Three-level trail for the personal assigned-to-me findings queue. */
export function GovernanceFindingsAssignedToMeBreadcrumb(): JSX.Element {
  const { productLine } = useProductLine();
  const findingsHref = findingsPathForProductLine(productLine);

  if (productLine === "security") {
    return (
      <OperatorPageBreadcrumb
        data-testid="governance-assigned-to-me-breadcrumb"
        items={[
          { label: "Findings", href: findingsHref },
          { label: "Assigned to me" },
        ]}
      />
    );
  }

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
