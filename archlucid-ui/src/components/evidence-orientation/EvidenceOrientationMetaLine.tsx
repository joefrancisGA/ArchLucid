import { OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EvidenceOrientationMetaLineProps = {
  readonly testId: string;
  /** Scan marker, for example "Last reviewed 2026-07" or "As of contract v1". */
  readonly label: string;
  /** Applicability sentence that qualifies the label. */
  readonly text: string;
};

/** `Label — applicability` freshness line used above or below a claim-discipline band. */
export function EvidenceOrientationMetaLine({
  testId,
  label,
  text,
}: EvidenceOrientationMetaLineProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}
      data-testid={testId}
    >
      <span className="font-medium text-al-text-primary">{label}</span>
      {" — "}
      {text}
    </p>
  );
}
