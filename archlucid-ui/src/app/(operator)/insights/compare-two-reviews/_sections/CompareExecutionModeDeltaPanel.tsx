"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CompareExecutionModeDeltaView } from "@/lib/review-quality/compare-execution-mode-delta";

export type CompareExecutionModeDeltaPanelProps = {
  readonly view: CompareExecutionModeDeltaView | null;
};

/** Compare-two-reviews execution-mode delta in buyer verdict chrome (TB-2071 hoist). */
export function CompareExecutionModeDeltaPanel(
  props: CompareExecutionModeDeltaPanelProps,
): React.JSX.Element | null {
  if (props.view === null) {
    return null;
  }

  const { baseline, target, changed, advisoryParagraph } = props.view;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-execution-mode-delta-panel"
      aria-labelledby="compare-execution-mode-delta-heading"
    >
      <h2
        id="compare-execution-mode-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Execution mode delta
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {changed
          ? "Execution modes differ or metadata is missing — treat finding and cost deltas as directional."
          : "Both reviews used the same execution mode."}
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {[baseline, target].map((side) => (
          <div
            key={side.label}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`compare-execution-mode-${side.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{side.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {side.modeLabel}
            </dd>
          </div>
        ))}
      </dl>
      {advisoryParagraph !== null ? (
        <p
          className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="compare-execution-mode-delta-advisory"
        >
          {advisoryParagraph}
        </p>
      ) : null}
    </section>
  );
}
