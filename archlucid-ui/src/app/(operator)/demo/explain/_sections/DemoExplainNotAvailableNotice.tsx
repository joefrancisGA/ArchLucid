import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DemoExplainNotAvailableNotice() {
  return (
    <div
      data-testid="demo-explain-not-available"
      role="status"
      className={cn(
        "rounded border border-neutral-300 bg-neutral-50 p-4 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>The example analysis is not available in this environment.</p>
    </div>
  );
}
