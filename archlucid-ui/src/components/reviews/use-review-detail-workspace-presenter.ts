"use client";

import { useCallback } from "react";

import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { writeReviewDetailTabToUrl } from "@/lib/review-detail-workspace-tabs";

export type UseReviewDetailWorkspacePresenterInput = {
  readonly activeTab: ReviewDetailTabId;
  readonly initialFindingId: string | null;
  readonly initialWorkbenchFocus: ReviewWorkbenchColumnId | null;
};

export type UseReviewDetailWorkspacePresenterResult = {
  readonly exitPresenter: () => void;
  readonly enterPresenter: () => void;
};

export function useReviewDetailWorkspacePresenter(
  input: UseReviewDetailWorkspacePresenterInput,
): UseReviewDetailWorkspacePresenterResult {
  const exitPresenter = useCallback(() => {
    writeReviewDetailTabToUrl(input.activeTab, {
      findingId: input.initialFindingId,
      workbenchFocus: input.initialWorkbenchFocus,
      presenter: null,
    });
    window.location.reload();
  }, [input.activeTab, input.initialFindingId, input.initialWorkbenchFocus]);

  const enterPresenter = useCallback(() => {
    writeReviewDetailTabToUrl(input.activeTab, {
      findingId: input.initialFindingId,
      workbenchFocus: input.initialWorkbenchFocus,
      presenter: true,
    });
    window.location.reload();
  }, [input.activeTab, input.initialFindingId, input.initialWorkbenchFocus]);

  return { exitPresenter, enterPresenter };
}
