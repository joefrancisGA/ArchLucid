"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import { resolveActiveReviewDetailTabFromSearchParams } from "@/lib/resolve-review-workspace-visible-tabs";
import {
  REVIEW_DETAIL_TAB_PARAM,
  resolveReviewDetailTab,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

export type UseResolvedReviewDetailActiveTabInput = {
  readonly tabLifecycle?: ResolveReviewDetailVisibleTabsInput;
  readonly lifecycle?: ReviewWorkspaceLifecycle;
};

/** Resolves the effective review tab for peripheral chrome (sticky actions, section nav). */
export function useResolvedReviewDetailActiveTab(
  input: UseResolvedReviewDetailActiveTabInput = {},
): ReviewDetailTabId {
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();

  return useMemo(() => {
    if (input.tabLifecycle === undefined) {
      return resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));
    }

    return resolveActiveReviewDetailTabFromSearchParams({
      searchParams,
      tabLifecycle: input.tabLifecycle,
      lifecycle: input.lifecycle,
      workingDesk: isWorkingMode,
    });
  }, [input.lifecycle, input.tabLifecycle, isWorkingMode, searchParams]);
}
