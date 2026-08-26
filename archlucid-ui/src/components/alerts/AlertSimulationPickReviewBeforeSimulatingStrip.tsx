"use client";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AlertSimulationPickReviewBeforeSimulatingStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before alert simulation is treated as scoped to a review. */
export function AlertSimulationPickReviewBeforeSimulatingStrip(
  props: AlertSimulationPickReviewBeforeSimulatingStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = (workspaceRun?.activeRunId ?? "").trim();
  const pickerValue =
    props.selectedReviewId.trim().length > 0
      ? props.selectedReviewId
      : workspaceRunId.length > 0
        ? workspaceRunId
        : "";

  return (
    <section
      aria-labelledby="alert-simulation-pick-review-before-simulating-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="alert-simulation-pick-review-before-simulating-strip"
    >
      <h2
        id="alert-simulation-pick-review-before-simulating-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before simulating
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Simulation outcomes are easiest to interpret against a finalized review package. Choose one to keep
        threshold previews aligned.
      </p>
      <div className="mt-3 min-w-[16rem] max-w-xl">
        <AskRunIdPicker
          value={pickerValue}
          onChange={(value) => {
            if (value.trim().length > 0) {
              props.onSelectReview(value.trim());
            }
          }}
          selectedThreadId=""
          committedOnly
          preferAutoPick={false}
          autoSelectSyntheticSample={false}
          label="Review package"
          fieldId="alert-simulation-pick-review-before-simulating"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
