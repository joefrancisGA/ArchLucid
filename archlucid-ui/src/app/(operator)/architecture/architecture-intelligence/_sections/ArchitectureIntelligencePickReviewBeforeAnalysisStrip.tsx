"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligencePickReviewBeforeAnalysisStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before architecture intelligence analysis runs. */
export function ArchitectureIntelligencePickReviewBeforeAnalysisStrip(
  props: ArchitectureIntelligencePickReviewBeforeAnalysisStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = workspaceRun.runId.trim();
  const pickerValue =
    props.selectedReviewId.trim().length > 0
      ? props.selectedReviewId
      : workspaceRunId.length > 0
        ? workspaceRunId
        : "";

  useEffect(() => {
    if (props.selectedReviewId.trim().length > 0) {
      return;
    }

    if (workspaceRunId.length > 0) {
      props.onSelectReview(workspaceRunId);
    }
  }, [props.onSelectReview, props.selectedReviewId, workspaceRunId]);

  return (
    <section
      aria-labelledby="architecture-intelligence-pick-review-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="architecture-intelligence-pick-review-before-analysis-strip"
    >
      <h2
        id="architecture-intelligence-pick-review-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before running analysis
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Architecture intelligence is scoped to an {REVIEW_PACKAGE_LABEL.toLowerCase()}. Choose one to analyze indexed evidence.
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
          committedOnly={false}
          preferAutoPick={false}
          autoSelectSyntheticSample={false}
          label={REVIEW_PACKAGE_LABEL}
          fieldId="architecture-intelligence-pick-review"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
