import type { ReactElement } from "react";

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
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-4 shadow-sm"
      aria-labelledby={headingId}
      role="region"
    >
      <h2
        id={headingId}
        className="m-0 text-sm font-semibold text-amber-950 dark:text-amber-100"
      >
        Reasoning summary
      </h2>
      <p className="m-0 mt-2 text-sm leading-relaxed text-amber-950/95 dark:text-amber-50/95">{text}</p>
    </section>
  );
}
