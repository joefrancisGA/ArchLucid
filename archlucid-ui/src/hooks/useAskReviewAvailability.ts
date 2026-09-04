"use client";

import { useEffect, useState } from "react";

import { operatorAllowsSyntheticAskRunPick } from "@/components/ask-run-id-picker-helpers";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

export type AskReviewAvailability = {
  readonly loading: boolean;
  readonly hasSelectableReviews: boolean;
};

/** Loads default-project reviews once for Ask page empty-state gating (aligned with AskRunIdPicker synthetic fallback rules). */
export function useAskReviewAvailability(): AskReviewAvailability {
  const { isWorkingMode } = useWorkspaceMode();
  const allowsSyntheticPick = operatorAllowsSyntheticAskRunPick(isWorkingMode);
  const { data, isLoading, isError } = useAskProjectRunsQuery("default");
  const [hasSelectableReviews, setHasSelectableReviews] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const items = data?.items ?? [];

    if (isError) {
      setHasSelectableReviews(allowsSyntheticPick);

      return;
    }

    setHasSelectableReviews(items.length > 0 || allowsSyntheticPick);
  }, [allowsSyntheticPick, data?.items, isError, isLoading]);

  return { loading: isLoading, hasSelectableReviews };
}
