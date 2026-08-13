import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <div className="w-full max-w-[1200px]">
      <OperatorPageHeader title={GOVERNANCE_OVERVIEW_PAGE_TITLE} headingLevel="h1" />
      <OperatorLoadingNotice>
        <strong>Loading governance workflow.</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
