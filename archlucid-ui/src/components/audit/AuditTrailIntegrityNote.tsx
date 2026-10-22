import { cn } from "@/lib/utils";
import { AUDIT_TRAIL_INTEGRITY_NOTE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Tamper-evident framing for the operator audit log — procurement buyers look for append-only honesty. */
export function AuditTrailIntegrityNote(props: { readonly className?: string }): React.JSX.Element {
  return (
    <p
      className={cn(
        "m-0 max-w-3xl rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-al-text-secondary dark:border-neutral-700",
        OPERATOR_TYPOGRAPHY.helper,
        props.className,
      )}
      role="note"
      data-testid="audit-trail-integrity-note"
    >
      {AUDIT_TRAIL_INTEGRITY_NOTE}
    </p>
  );
}
