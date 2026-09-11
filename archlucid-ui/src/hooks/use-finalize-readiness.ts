"use client";

import { useEffect, useState } from "react";

import { getFinalizeReadiness } from "@/lib/api/finalize-readiness";
import type { FinalizeReadinessResult } from "@/types/finalize-readiness";

export function useFinalizeReadiness(input: {
  readonly runId: string;
  readonly enabled: boolean;
  readonly acknowledgedAssumptionIds: ReadonlySet<string>;
}): {
  readonly readiness: FinalizeReadinessResult | null;
  readonly loading: boolean;
} {
  const [readiness, setReadiness] = useState<FinalizeReadinessResult | null>(null);
  const [loading, setLoading] = useState(input.enabled);
  const acknowledgedKey = [...input.acknowledgedAssumptionIds].sort().join("|");

  useEffect(() => {
    if (!input.enabled) {
      setReadiness(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getFinalizeReadiness(input.runId, [...input.acknowledgedAssumptionIds])
      .then((response) => {
        if (!cancelled) {
          setReadiness(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReadiness(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [input.enabled, input.runId, acknowledgedKey]);

  return { readiness, loading };
}
