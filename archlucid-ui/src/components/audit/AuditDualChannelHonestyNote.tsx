import { cn } from "@/lib/utils";
import { AUDIT_DUAL_CHANNEL_HONESTY_NOTE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Durable SQL audit vs baseline mutation log-only channel — cite AUDIT_COVERAGE_MATRIX for procurement reviewers. */
export function AuditDualChannelHonestyNote(props: { readonly className?: string }): React.JSX.Element {
  return (
    <p
      className={cn(
        "m-0 max-w-3xl rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100",
        OPERATOR_TYPOGRAPHY.helper,
        props.className,
      )}
      role="note"
      data-testid="audit-dual-channel-honesty-note"
    >
      {AUDIT_DUAL_CHANNEL_HONESTY_NOTE}
    </p>
  );
}
