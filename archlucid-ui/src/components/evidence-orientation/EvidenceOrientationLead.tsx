import { OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EvidenceOrientationLeadProps = {
  readonly testId: string;
  readonly text: string;
};

/** Optional orienting sentence rendered above the claim-discipline band. */
export function EvidenceOrientationLead({ testId, text }: EvidenceOrientationLeadProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}
      data-testid={testId}
    >
      {text}
    </p>
  );
}
