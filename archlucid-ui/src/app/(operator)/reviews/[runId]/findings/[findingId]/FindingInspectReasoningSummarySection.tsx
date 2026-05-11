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
      className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/35"
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
