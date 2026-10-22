"use client";

import { useCallback } from "react";

import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { writeReviewDetailFindingIdToUrl, writeReviewDetailTabToUrl } from "@/lib/review-detail-workspace-tabs";

export type UseReviewDetailWorkspaceSelectionInput = {
  readonly activeTab: ReviewDetailTabId;
  readonly initialFindingId: string | null;
  readonly workbenchFocusColumn: ReviewWorkbenchColumnId | null;
};

export type UseReviewDetailWorkspaceSelectionResult = {
  readonly onFindingIdChange: (findingId: string | null) => void;
  readonly onFocusColumnChange: (column: ReviewWorkbenchColumnId | null) => void;
};

export function useReviewDetailWorkspaceSelection(
  input: UseReviewDetailWorkspaceSelectionInput,
): UseReviewDetailWorkspaceSelectionResult {
  const onFindingIdChange = useCallback((findingId: string | null) => {
    writeReviewDetailFindingIdToUrl(findingId);
  }, []);

  const onFocusColumnChange = useCallback(
    (column: ReviewWorkbenchColumnId | null) => {
      writeReviewDetailTabToUrl(input.activeTab, { workbenchFocus: column });
    },
    [input.activeTab],
  );

  return { onFindingIdChange, onFocusColumnChange };
}
