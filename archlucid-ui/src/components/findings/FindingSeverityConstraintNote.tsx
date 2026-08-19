import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingSeverityConstraintNoteProps = {
  readonly note: string;
};

/** TB-2319: ties severity labels to stated intake constraints when finding text references them. */
export function FindingSeverityConstraintNote(
  props: FindingSeverityConstraintNoteProps,
): React.JSX.Element {
  return (
    <p
      className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="finding-severity-constraint-note"
    >
      {props.note}
    </p>
  );
}
