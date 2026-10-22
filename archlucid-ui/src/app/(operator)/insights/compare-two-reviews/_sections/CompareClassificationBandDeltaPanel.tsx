"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareClassificationBandDeltaView } from "@/lib/review-quality/compare-classification-band-delta";

export type CompareClassificationBandDeltaPanelProps = {
  readonly view: CompareClassificationBandDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews decision-grade vs checklist counts — inspectable stratification, not a score. */
export function CompareClassificationBandDeltaPanel(
  props: CompareClassificationBandDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-classification-band-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading finding classification counts…
        </p>
      </section>
    );
  }

  if (props.view === null) {
    return null;
  }

  const { baseline, target } = props.view;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-classification-band-delta-panel"
      aria-labelledby="compare-classification-band-delta-heading"
    >
      <h2
        id="compare-classification-band-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Finding classification delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Decision-grade vs checklist mix on each review — insight-density gate stratification, not a quality score.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-classification-band-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.summaryLine}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
