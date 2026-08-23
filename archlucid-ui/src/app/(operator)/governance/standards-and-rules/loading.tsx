import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceStandardsRulesBreadcrumb } from "@/components/governance/GovernanceStandardsRulesBreadcrumb";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import {
  STANDARDS_RULES_LOADING_STATUS,
  STANDARDS_RULES_PAGE_SUBTITLE,
  STANDARDS_RULES_PAGE_TITLE,
} from "@/lib/standards-rules-page";

/** Structured navigation shell while the standards-and-rules client chunk loads. */
export default function GovernanceResolutionLoading() {
  return (
    <OperatorPageContainer
      variant="dashboard"
      className="space-y-4"
      data-testid="standards-rules-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={GOVERNANCE_STANDARDS_AND_RULES_PATH}
        title={STANDARDS_RULES_PAGE_TITLE}
        subtitle={STANDARDS_RULES_PAGE_SUBTITLE}
        breadcrumb={<GovernanceStandardsRulesBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{STANDARDS_RULES_LOADING_STATUS}</p>
    </OperatorPageContainer>
  );
}
