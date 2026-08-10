import { cn } from "@/lib/utils";
import {
  getMutationReversibilityEntry,
  type GovernanceMutationReversibilityId,
} from "@/lib/mutation-reversibility-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type MutationReversibilityNoticeProps = {
  readonly mutationId: GovernanceMutationReversibilityId;
  readonly className?: string;
};

/** Confirmation-dialog copy for governed mutation reversibility (TB-2148). */
export function MutationReversibilityNotice(props: MutationReversibilityNoticeProps): React.JSX.Element {
  const entry = getMutationReversibilityEntry(props.mutationId);

  return (
    <p
      className={cn(
        "m-0 rounded-md border border-al-border bg-al-surface-raised px-3 py-2 text-al-text-secondary",
        OPERATOR_TYPOGRAPHY.helper,
        props.className,
      )}
      data-testid={`mutation-reversibility-notice-${props.mutationId}`}
      data-reversibility-class={entry.classification}
    >
      {entry.confirmationLead}
    </p>
  );
}
