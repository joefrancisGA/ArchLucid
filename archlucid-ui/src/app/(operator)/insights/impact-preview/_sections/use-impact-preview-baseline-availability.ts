"use client";

import { useEffect, useState } from "react";

import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";

export type ImpactPreviewBaselineAvailability = {
  readonly loading: boolean;
  readonly finalizedCount: number;
};

/** Loads committed reviews available as impact preview baselines. */
export function useImpactPreviewBaselineAvailability(): ImpactPreviewBaselineAvailability {
  const [loading, setLoading] = useState(true);
  const [finalizedCount, setFinalizedCount] = useState(0);

  useEffect(() => {
    let canceled = false;

    void loadProjectRunsMergedWithDemoFallback("default", { forCompare: true, committedOnly: true })
      .then((merged) => {
        if (canceled) {
          return;
        }

        setFinalizedCount(merged.items.length);
        setLoading(false);
      })
      .catch(() => {
        if (canceled) {
          return;
        }

        setFinalizedCount(0);
        setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  return {
    loading,
    finalizedCount,
  };
}
