"use client";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SponsorDashboardPickReviewBeforeKpisStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before sponsor dashboard KPIs are treated as scoped to a review. */
export function SponsorDashboardPickReviewBeforeKpisStrip(
  props: SponsorDashboardPickReviewBeforeKpisStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = workspaceRun?.activeRunId?.trim() ?? "";
  const pickerValue =
    props.selectedReviewId.trim().length > 0
      ? props.selectedReviewId
      : workspaceRunId.length > 0
        ? workspaceRunId
        : "";

  return (
    <section
      aria-labelledby="sponsor-dashboard-pick-review-before-kpis-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="sponsor-dashboard-pick-review-before-kpis-strip"
    >
      <h2
        id="sponsor-dashboard-pick-review-before-kpis-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before reading sponsor KPIs
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Sponsor savings and drift metrics are easiest to interpret against a finalized review package. Choose one
        to keep executive context aligned.
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
          fieldId="sponsor-dashboard-pick-review-before-kpis"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
