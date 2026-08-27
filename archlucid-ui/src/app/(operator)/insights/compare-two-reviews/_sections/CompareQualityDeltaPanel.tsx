"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildCompareQualityDeltaRows,
  type CompareQualityDeltaCounts,
  type CompareTrustLaneBreakdownRow,
} from "@/lib/review-quality/compare-quality-delta";

export type CompareQualityDeltaPanelProps = {
  readonly counts: CompareQualityDeltaCounts;
  readonly newFindingTrustLanes?: readonly CompareTrustLaneBreakdownRow[];
};

/** TB-2317: stratified auditable improvement counts on compare. */
export function CompareQualityDeltaPanel(props: CompareQualityDeltaPanelProps): React.JSX.Element {
  const rows = buildCompareQualityDeltaRows(props.counts);
  const trustLanes = props.newFindingTrustLanes ?? [];

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
                <span className="ml-2 text-al-text-secondary dark:text-neutral-300">improved</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      {trustLanes.length > 0 ? (
        <div className="mt-4" data-testid="compare-quality-delta-trust-lanes">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            New findings by producing lane
          </h3>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Origin × grounding for each finding appears on inspect — these counts are lane stratification only.
          </p>
          <dl className="m-0 mt-2 grid gap-2 sm:grid-cols-2">
            {trustLanes.map((lane) => (
              <div
                key={lane.label}
                className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
              >
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{lane.label}</dt>
                <dd className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {lane.count}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
