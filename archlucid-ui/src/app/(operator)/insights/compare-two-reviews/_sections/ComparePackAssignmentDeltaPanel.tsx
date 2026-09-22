"use client";

import { cn } from "@/lib/utils";

import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ComparePackAssignmentDeltaView } from "@/lib/review-quality/compare-pack-assignment-delta";

export type ComparePackAssignmentDeltaPanelProps = {
  readonly view: ComparePackAssignmentDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews pack assignment mix for buyer verdict chrome. */
export function ComparePackAssignmentDeltaPanel(
  props: ComparePackAssignmentDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-pack-assignment-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading policy pack assignments…
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
      data-testid="compare-pack-assignment-delta-panel"
      aria-labelledby="compare-pack-assignment-delta-heading"
    >
      <h2
        id="compare-pack-assignment-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Policy pack assignment delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {changed
          ? "Assigned packs differ — compliance keys and gate thresholds may not be comparable without a pack-delta rehearsal."
          : "Assigned packs match on both reviews."}
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-pack-assignment-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.summaryLine}
            </dd>
          </div>
        ))}
      </dl>
      <PolicyPackInfluenceHonestyChip className="mt-3" />
    </section>
  );
}
