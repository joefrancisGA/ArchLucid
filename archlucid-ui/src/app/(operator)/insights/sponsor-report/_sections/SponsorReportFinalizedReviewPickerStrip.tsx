"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { Button } from "@/components/ui/button";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

export type SponsorReportFinalizedReviewPickerStripProps = {
  readonly hasFinalizedReviews: boolean;
};

/** Guides sponsors to open a finalized architecture package before reading aggregate outcomes. */
export function SponsorReportFinalizedReviewPickerStrip(
  props: SponsorReportFinalizedReviewPickerStripProps,
): React.JSX.Element | null {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = (workspaceRun?.activeRunId?.trim() ?? "");
  const [selectedReviewId, setSelectedReviewId] = useState(workspaceRunId);

  useEffect(() => {
    if (selectedReviewId.trim().length === 0 && workspaceRunId.length > 0) {
      setSelectedReviewId(workspaceRunId);
    }
  }, [selectedReviewId, workspaceRunId]);

  if (!props.hasFinalizedReviews) {
    return null;
  }

  const openReviewId = selectedReviewId.trim();

  return (
    <section
      aria-labelledby="sponsor-report-finalized-review-picker-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="sponsor-report-finalized-review-picker-strip"
    >
      <h2
        id="sponsor-report-finalized-review-picker-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a finalized review first
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Open the {REVIEW_PACKAGE_LABEL.toLowerCase()} behind a row in the timeline before sharing exports with stakeholders.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] max-w-xl flex-1">
          <AskRunIdPicker
            value={openReviewId}
            onChange={(value) => {
              setSelectedReviewId(value.trim());
            }}
            selectedThreadId=""
            committedOnly
            preferAutoPick={false}
            autoSelectSyntheticSample={false}
            label="Finalized review"
            fieldId="sponsor-report-finalized-review-picker"
            hideFieldHelper
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          disabled={openReviewId.length === 0}
          data-testid="sponsor-report-finalized-review-open"
        >
          <Link href={openReviewId.length > 0 ? reviewDetailPath(openReviewId) : "#"}>Open {REVIEW_PACKAGE_LABEL.toLowerCase()}</Link>
        </Button>
      </div>
    </section>
  );
}
