"use client";

import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator-static-demo";

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
  const [loading, setLoading] = useState(true);
  const [hasSelectableReviews, setHasSelectableReviews] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);

      try {
        const merged = await loadProjectRunsMergedWithDemoFallback("default");
        const allowSyntheticPick = operatorAllowsSyntheticAskRunPick();

        if (!cancelled) {
          setHasSelectableReviews(merged.items.length > 0 || allowSyntheticPick);
        }
      } catch {
        if (!cancelled) {
          setHasSelectableReviews(operatorAllowsSyntheticAskRunPick());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, hasSelectableReviews };
}
