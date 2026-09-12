"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareRoiHeadlineDeltaView } from "@/lib/review-quality/compare-roi-headline-delta";

export type CompareRoiHeadlineDeltaPanelProps = {
  readonly view: CompareRoiHeadlineDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews run-level estimated USD with disposition-aware non-summing honesty. */
export function CompareRoiHeadlineDeltaPanel(
  props: CompareRoiHeadlineDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-roi-headline-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading run-level sponsor ROI estimates…
        </p>
      </section>
    );
  }

  if (props.view === null) {
    return null;
  }

  const { baseline, target, nonSummingLine } = props.view;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-roi-headline-delta-panel"
      aria-labelledby="compare-roi-headline-delta-heading"
    >
      <h2
        id="compare-roi-headline-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Run-level sponsor ROI delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Estimated USD per review from server findings — not a portfolio rollup sum.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-roi-headline-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.savingsLabel ?? "No estimated savings on this run"}
            </dd>
            {side.basisFootnote !== null ? (
              <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {side.basisFootnote}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
      <p
        className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="compare-roi-headline-non-summing-line"
      >
        {nonSummingLine}
      </p>
    </section>
  );
}
