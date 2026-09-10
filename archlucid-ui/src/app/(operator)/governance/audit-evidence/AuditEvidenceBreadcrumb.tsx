import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF,
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL,
  AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/audit-evidence-page-copy";

/** Governance trail for `/governance/audit-evidence`: Governance → Audit evidence lineage. */
export function AuditEvidenceBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="audit-evidence-breadcrumb"
      items={[
        { label: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL, href: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF },
        { label: AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
