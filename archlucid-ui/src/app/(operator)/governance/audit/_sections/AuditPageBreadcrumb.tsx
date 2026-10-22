import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_HREF,
  GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_LABEL,
  GOVERNANCE_AUDIT_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/governance-audit-page-copy";

/** Governance trail for `/governance/audit`: Governance → Audit trail. */
export function AuditPageBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="audit-page-breadcrumb"
      items={[
        { label: GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_LABEL, href: GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_HREF },
        { label: GOVERNANCE_AUDIT_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}
