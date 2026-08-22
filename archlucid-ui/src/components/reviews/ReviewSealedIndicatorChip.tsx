import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewSealedIndicatorChipProps = {
  /** ISO-8601 UTC timestamp of when the package was sealed (golden manifest committed). */
  readonly sealedUtc: string;
  readonly className?: string;
};

/**
 * Persistent immutability indicator shown in the review header once a
 * golden manifest is committed. The visual treatment is deliberately distinct
 * from workflow StatusTags — this is a permanent state indicator, not a progress badge.
 */
export function ReviewSealedIndicatorChip({
  sealedUtc,
  className,
}: ReviewSealedIndicatorChipProps): ReactElement {
  const formatted = new Date(sealedUtc)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, " UTC");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 font-mono text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
        OPERATOR_TYPOGRAPHY.navHelper,
        className,
      )}
      aria-label={`Package finalized at ${formatted}`}
    >
      <Lock className="h-3 w-3 shrink-0" aria-hidden />
      <span>Finalized · {formatted}</span>
    </span>
  );
}
