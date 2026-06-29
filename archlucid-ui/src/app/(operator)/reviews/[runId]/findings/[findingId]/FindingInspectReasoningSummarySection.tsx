import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInspectReasoningSummarySectionProps = {
  readonly text: string;
};

/**
 * Highlighted, screen-reader-friendly synopsis of why the finding fired (deterministic template from API metadata).
 */
export function FindingInspectReasoningSummarySection({
  text,
}: FindingInspectReasoningSummarySectionProps): ReactElement {
  const headingId = "finding-inspect-reasoning-summary-heading";

  return (
    <section
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      aria-labelledby={headingId}
      role="region"
    >
      <h2
        id={headingId}
        className={cn("m-0 text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Reasoning summary
      </h2>
      <p className={cn("m-0 mt-2 leading-relaxed text-amber-950/95 dark:text-amber-50/95", OPERATOR_TYPOGRAPHY.body)}>{text}</p>
    </section>
  );
}
