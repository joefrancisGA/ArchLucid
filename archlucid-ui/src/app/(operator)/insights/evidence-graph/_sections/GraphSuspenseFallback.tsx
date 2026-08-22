import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function GraphSuspenseFallback() {
  return (
    <OperatorPageContainer
      variant="dashboard"
      className={isBuyerPolishedOperatorShellEnv() ? "max-w-6xl" : undefined}
    >
      <OperatorLoadingNotice>
        <strong>Loading graph.</strong>
        <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Reading review id from the URL…</p>
      </OperatorLoadingNotice>
    </OperatorPageContainer>
  );
}
