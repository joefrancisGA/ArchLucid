import { cn } from "@/lib/utils";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function GraphSuspenseFallback() {
  return (
    <div className={isBuyerPolishedOperatorShellEnv() ? "max-w-6xl" : "max-w-4xl"}>
      <OperatorLoadingNotice>
        <strong>Loading graph.</strong>
        <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Reading review id from the URL…</p>
      </OperatorLoadingNotice>
    </div>
  );
}
