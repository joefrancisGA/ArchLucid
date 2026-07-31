import { cn } from "@/lib/utils";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <div className="w-full max-w-[1200px]">
      <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {GOVERNANCE_OVERVIEW_PAGE_TITLE}
        </h1>
      </header>
      <OperatorLoadingNotice>
        <strong>Loading governance workflow.</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
