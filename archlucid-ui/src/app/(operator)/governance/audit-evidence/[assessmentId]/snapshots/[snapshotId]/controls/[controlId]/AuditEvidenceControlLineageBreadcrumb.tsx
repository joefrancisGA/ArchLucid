import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF,
  AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL,
  AUDIT_EVIDENCE_PAGE_TITLE,
} from "@/lib/audit-evidence-page-copy";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";

/** Governance trail for control lineage detail (GOO). */
export function AuditEvidenceControlLineageBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="audit-evidence-control-lineage-breadcrumb"
      items={[
        { label: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL, href: AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF },
        { label: AUDIT_EVIDENCE_PAGE_TITLE, href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH },
        { label: AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL },
      ]}
    />
  );
}
