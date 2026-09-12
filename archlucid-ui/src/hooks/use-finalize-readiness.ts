"use client";

import { useEffect, useState } from "react";

import { getFinalizeReadiness } from "@/lib/api/finalize-readiness";
import { subscribeFinalizeReadinessRefresh } from "@/lib/review-quality/finalize-readiness-refresh-notify";
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
  const [refreshToken, setRefreshToken] = useState(0);
  const acknowledgedKey = [...input.acknowledgedAssumptionIds].sort().join("|");

  useEffect(() => {
    if (!input.enabled) {
      return () => {};
    }

    return subscribeFinalizeReadinessRefresh(input.runId, () => {
      setRefreshToken((current) => current + 1);
    });
  }, [input.enabled, input.runId]);

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
  }, [input.enabled, input.runId, acknowledgedKey, refreshToken]);

  return { readiness, loading };
}
