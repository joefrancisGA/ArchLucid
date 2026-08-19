import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { STANDARDS_RULES_PAGE_TITLE } from "@/lib/standards-rules-page";

/** Governance trail for the Standards & rules inspection surface (GRS). */
export function GovernanceStandardsRulesBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-standards-rules-breadcrumb"
      items={[
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: STANDARDS_RULES_PAGE_TITLE },
      ]}
    />
  );
}
