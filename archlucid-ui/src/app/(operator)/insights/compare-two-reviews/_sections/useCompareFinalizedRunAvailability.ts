"use client";

import { useEffect, useState } from "react";

import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";

export type CompareFinalizedRunAvailability = {
  readonly loading: boolean;
  readonly finalizedCount: number;
  readonly insufficientForCompare: boolean;
};

/**
 * Loads committed (finalized) reviews available for compare pickers.
 * Uses the same scope-wide inventory as the Reviews hub when project is `default`
 * (create stores system name as the run project slug). Demo fallback may inject
 * showcase rows when the live list is empty.
 */
export function useCompareFinalizedRunAvailability(): CompareFinalizedRunAvailability {
  const [loading, setLoading] = useState(true);
  const [finalizedCount, setFinalizedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void loadProjectRunsMergedWithDemoFallback("default", { forCompare: true, committedOnly: true })
      .then((merged) => {
        if (cancelled) {
          return;
        }

        setFinalizedCount(merged.items.length);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setFinalizedCount(0);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    finalizedCount,
    insufficientForCompare: !loading && finalizedCount < 2,
  };
}
