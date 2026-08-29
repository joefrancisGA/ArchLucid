import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { EVIDENCE_EXTRACTION_AWAITING_CLARIFICATIONS_LABEL } from "@/lib/evidence/evidence-extraction-progress-copy";
import { cn } from "@/lib/utils";

export type EvidenceExtractionAwaitingSkeletonProps = {
  readonly className?: string;
};

/** Subtle loading strip for the clarifications panel while evidence text is being read. */
export function EvidenceExtractionAwaitingSkeleton(
  props: EvidenceExtractionAwaitingSkeletonProps,
): React.JSX.Element {
  return (
    <div
      className={cn("space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700", props.className)}
      data-testid="evidence-extraction-awaiting-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {EVIDENCE_EXTRACTION_AWAITING_CLARIFICATIONS_LABEL}
      </p>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
