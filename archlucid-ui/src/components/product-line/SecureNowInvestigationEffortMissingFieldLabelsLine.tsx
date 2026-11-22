import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowInvestigationEffortInputFields } from "@/lib/product-line/securenow-investigation-effort-input-storage";
import { listSecureNowInvestigationEffortMissingFieldLabels } from "@/lib/product-line/securenow-investigation-effort-missing-fields";
import { cn } from "@/lib/utils";

export function SecureNowInvestigationEffortMissingFieldLabelsLine(props: {
  readonly inputs: SecureNowInvestigationEffortInputFields;
}): React.JSX.Element | null {
  const missingLabels = listSecureNowInvestigationEffortMissingFieldLabels(props.inputs);

  if (missingLabels.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-investigation-effort-missing-field-labels"
    >
      Missing worksheet fields: {missingLabels.join("; ")}.
    </p>
  );
}