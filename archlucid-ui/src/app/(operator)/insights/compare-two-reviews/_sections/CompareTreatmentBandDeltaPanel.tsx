"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareTreatmentBandDeltaView } from "@/lib/review-quality/compare-treatment-band-delta";

export type CompareTreatmentBandDeltaPanelProps = {
  readonly view: CompareTreatmentBandDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews insight-density treatment mix — demotion vs promote, not a quality score. */
export function CompareTreatmentBandDeltaPanel(
  props: CompareTreatmentBandDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-treatment-band-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading insight-density treatment counts…
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
      data-testid="compare-treatment-band-delta-panel"
      aria-labelledby="compare-treatment-band-delta-heading"
    >
      <h2
        id="compare-treatment-band-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Insight-density treatment delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Promoted decision-grade vs checklist vs demoted-to-checklist mix on each review — gate stratification,
        not a quality score.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-treatment-band-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
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
