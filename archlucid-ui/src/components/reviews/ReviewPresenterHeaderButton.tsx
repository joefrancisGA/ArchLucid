"use client";

import { Button } from "@/components/ui/button";
import { useReviewDetailWorkspacePresenter } from "@/components/reviews/use-review-detail-workspace-presenter";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

export type ReviewPresenterHeaderButtonProps = {
  readonly reviewCompleted: boolean;
};

/** Header-group presenter entry — gated until the review pipeline completes. */
export function ReviewPresenterHeaderButton(
  props: ReviewPresenterHeaderButtonProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const presenter = useReviewDetailWorkspacePresenter();

  if (!isWorkingMode || !props.reviewCompleted) {
    return null;
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
