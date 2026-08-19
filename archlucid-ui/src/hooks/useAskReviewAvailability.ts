"use client";

import { useEffect, useState } from "react";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator/operator-static-demo";

function operatorAllowsSyntheticAskRunPick(): boolean {
  return (
    isBuyerPolishedOperatorShellEnv() ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    shouldMergeOperatorDemoAlertSample()
  );
}

export type AskReviewAvailability = {
  readonly loading: boolean;
  readonly hasSelectableReviews: boolean;
};

/** Loads default-project reviews once for Ask page empty-state gating (aligned with AskRunIdPicker synthetic fallback rules). */
export function useAskReviewAvailability(): AskReviewAvailability {
  const { data, isLoading, isError } = useAskProjectRunsQuery("default");
  const [hasSelectableReviews, setHasSelectableReviews] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const allowSyntheticPick = operatorAllowsSyntheticAskRunPick();
    const items = data?.items ?? [];

    if (isError) {
      setHasSelectableReviews(allowSyntheticPick);

      return;
    }

    setHasSelectableReviews(items.length > 0 || allowSyntheticPick);
  }, [data?.items, isError, isLoading]);

  return { loading: isLoading, hasSelectableReviews };
}
