import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function AskSuspenseFallback() {
  return (
    <OperatorPageContainer variant="workflow" className="p-4">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading Ask…</p>
    </OperatorPageContainer>
  );
}
