"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF,
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL,
  AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/audit-evidence-page-copy";

/** Trail for audit evidence lookup. SecureNow omits the Architecture Approval parent. */
export function AuditEvidenceBreadcrumb(): React.JSX.Element {
  const { productLine } = useProductLine();
  const items =
    productLine === "security"
      ? [{ label: AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE }]
      : [
          { label: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL, href: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF },
          { label: AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE },
        ];

  return <OperatorPageBreadcrumb data-testid="audit-evidence-breadcrumb" items={items} />;
}
