"use client";

import { useCallback } from "react";

import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { writeReviewDetailTabToUrl } from "@/lib/review-detail-workspace-tabs";

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
  const onFindingIdChange = useCallback(
    (findingId: string | null) => {
      writeReviewDetailTabToUrl(input.activeTab, {
        findingId,
        workbenchFocus: input.workbenchFocusColumn,
        presenter: null,
      });
    },
    [input.activeTab, input.workbenchFocusColumn],
  );

  const onFocusColumnChange = useCallback(
    (column: ReviewWorkbenchColumnId | null) => {
      // Do not pass `initialFindingId` from stale `useSearchParams` — only update focus column.
      writeReviewDetailTabToUrl(input.activeTab, {
        workbenchFocus: column,
        presenter: null,
      });
    },
    [input.activeTab],
  );

  return { onFindingIdChange, onFocusColumnChange };
}
