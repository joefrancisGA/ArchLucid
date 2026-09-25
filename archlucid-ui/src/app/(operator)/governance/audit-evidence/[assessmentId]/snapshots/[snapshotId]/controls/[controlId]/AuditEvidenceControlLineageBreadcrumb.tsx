"use client";

import { usePathname } from "next/navigation";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF,
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL,
  AUDIT_EVIDENCE_PAGE_TITLE,
} from "@/lib/audit-evidence-page-copy";
import { auditEvidenceLineageLookupPathFromPathname } from "@/lib/audit-evidence-lineage-route";

/** Governance trail for control lineage detail (COO / GOO). */
export function AuditEvidenceControlLineageBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const { productLine } = useProductLine();
  const lookupPath = auditEvidenceLineageLookupPathFromPathname(pathname);

  const items =
    productLine === "security"
      ? [
          { label: AUDIT_EVIDENCE_PAGE_TITLE, href: lookupPath },
          { label: AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL },
        ]
      : [
          { label: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL, href: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF },
          { label: AUDIT_EVIDENCE_PAGE_TITLE, href: lookupPath },
          { label: AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL },
        ];

  return (
    <OperatorPageBreadcrumb
      data-testid="audit-evidence-control-lineage-breadcrumb"
      items={items}
    />
  );
}
