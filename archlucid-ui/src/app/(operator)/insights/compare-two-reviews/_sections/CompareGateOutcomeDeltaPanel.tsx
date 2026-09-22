"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareGateOutcomeDeltaView } from "@/lib/review-quality/compare-gate-outcome-delta";

export type CompareGateOutcomeDeltaPanelProps = {
  readonly view: CompareGateOutcomeDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews pre-commit gate outcome — not a quality score. */
export function CompareGateOutcomeDeltaPanel(
  props: CompareGateOutcomeDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-gate-outcome-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading pre-commit gate outcomes…
        </p>
      </section>
    );
  }

  if (props.view === null) {
    return null;
  }

  const { baseline, target, changed } = props.view;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-gate-outcome-delta-panel"
      aria-labelledby="compare-gate-outcome-delta-heading"
    >
      <h2
        id="compare-gate-outcome-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Pre-commit gate outcome delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {changed
          ? "Gate outcome changed between these reviews — treat finding and cost deltas in that context."
          : "Gate outcome is the same on both reviews."}
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-gate-outcome-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.gateLabel}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
