import { cn } from "@/lib/utils";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shown while the validate form client component is initializing (hydrates review context from the URL). */
export function ReplaySuspenseFallback() {
  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Validate review" helpKey="replay-run" />
      <OperatorLoadingNotice>
        <strong>Loading validation.</strong>
        <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
          Reading review context from the link so validate opens with the review prefilled…
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}
