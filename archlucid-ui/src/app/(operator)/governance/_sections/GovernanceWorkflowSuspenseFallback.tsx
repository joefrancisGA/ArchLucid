import { cn } from "@/lib/utils";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function GovernanceWorkflowSuspenseFallback() {
  return (
    <div className="w-full max-w-[1200px]">
      <OperatorLoadingNotice>
        <strong>Loading governance workflow.</strong>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Reading URL parameters…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
