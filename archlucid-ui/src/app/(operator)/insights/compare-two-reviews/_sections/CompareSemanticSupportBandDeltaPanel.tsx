"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareSemanticSupportBandDeltaView } from "@/lib/review-quality/compare-semantic-support-band-delta";

export type CompareSemanticSupportBandDeltaPanelProps = {
  readonly view: CompareSemanticSupportBandDeltaView | null;
  readonly loading?: boolean;
};

/** Compare-two-reviews semantic support band counts — inspectable stratification, not a score. */
export function CompareSemanticSupportBandDeltaPanel(
  props: CompareSemanticSupportBandDeltaPanelProps,
): React.JSX.Element | null {
  if (props.loading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="compare-semantic-support-band-delta-loading"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading semantic support band counts…
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
      data-testid="compare-semantic-support-band-delta-panel"
      aria-labelledby="compare-semantic-support-band-delta-heading"
    >
      <h2
        id="compare-semantic-support-band-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Semantic support band delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Decision-grade semantic support counts on each review — Lane B async scores may lag the sealed review.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-semantic-support-band-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.summaryLine ?? "No decision-grade findings"}
            </dd>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
              Supported {side.counts.supported} · Not yet scored {side.counts.unchecked} · Unsupported{" "}
              {side.counts.unsupported}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
