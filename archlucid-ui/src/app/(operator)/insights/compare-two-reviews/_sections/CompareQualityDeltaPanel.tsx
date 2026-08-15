"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildCompareQualityDeltaRows,
  type CompareQualityDeltaCounts,
} from "@/lib/review-quality/compare-quality-delta";

export type CompareQualityDeltaPanelProps = {
  readonly counts: CompareQualityDeltaCounts;
};

/** TB-2317: stratified auditable improvement counts on compare. */
export function CompareQualityDeltaPanel(props: CompareQualityDeltaPanelProps): React.JSX.Element {
  const rows = buildCompareQualityDeltaRows(props.counts);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-quality-delta-panel"
      aria-labelledby="compare-quality-delta-heading"
    >
      <h2
        id="compare-quality-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Auditable quality delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Directional counts only — every row is inspectable, not a synthetic quality score.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {row.before} → {row.after}
              {row.improved ? (
                <span className="ml-2 text-teal-800 dark:text-teal-300">improved</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
