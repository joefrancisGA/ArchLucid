"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { useReviewDetailWorkspacePresenter } from "@/components/reviews/use-review-detail-workspace-presenter";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

export type ReviewPresenterHeaderButtonProps = {
  readonly runId: string;
  readonly reviewCompleted: boolean;
  readonly manifestVersion?: string | null;
};

/** Header-group presenter entry — gated until the review pipeline completes and manifest is sealed. */
export function ReviewPresenterHeaderButton(
  props: ReviewPresenterHeaderButtonProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const presenter = useReviewDetailWorkspacePresenter();
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion ?? null,
  });

  if (!isWorkingMode || !props.reviewCompleted) {
    return null;
  }

  if (sealedManifestBlockedReason !== null) {
    return (
      <p
        role="alert"
        className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-presenter-blocked-reason"
      >
        {sealedManifestBlockedReason}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="review-presenter-enter"
      onClick={presenter.enterPresenter}
    >
      Present
    </Button>
  );
}
