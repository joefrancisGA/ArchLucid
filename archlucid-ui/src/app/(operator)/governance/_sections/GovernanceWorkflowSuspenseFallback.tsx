import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <OperatorPageContainer variant="workflow">
      <OperatorPageHeader title={GOVERNANCE_OVERVIEW_PAGE_TITLE} headingLevel="h1" />
      <OperatorLoadingNotice>
        <strong>Loading approval workflow.</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </OperatorPageContainer>
  );
}
