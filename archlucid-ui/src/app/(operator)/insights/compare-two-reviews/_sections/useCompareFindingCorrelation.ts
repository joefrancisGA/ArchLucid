"use client";

import { useEffect, useState } from "react";

import { compareRunsEndToEnd } from "@/lib/api/architecture-runs";
import {
  coerceCompareFindingCorrelationMetadata,
  type CompareFindingCorrelationMetadata,
} from "@/lib/compare-finding-correlation";
import {
  coerceCompareFindingLifecycleRecords,
  coerceCompareFindingLifecycleSummary,
  type CompareFindingLifecycleRecord,
  type CompareFindingLifecycleSummary,
} from "@/lib/compare-finding-lifecycle";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";

export type CompareFindingCorrelationLoadState = {
  readonly loading: boolean;
  readonly metadata: CompareFindingCorrelationMetadata | null;
  readonly lifecycle: CompareFindingLifecycleSummary | null;
  readonly lifecycleRecords: readonly CompareFindingLifecycleRecord[];
  readonly softFailureMessage: string | null;
};

/**
 * Loads finding correlation metadata from the end-to-end compare report. Failures are soft — compare results still render.
 */
export function useCompareFindingCorrelation(
  baselineRunId: string | null,
  targetRunId: string | null,
): CompareFindingCorrelationLoadState {
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<CompareFindingCorrelationMetadata | null>(null);
  const [lifecycle, setLifecycle] = useState<CompareFindingLifecycleSummary | null>(null);
  const [lifecycleRecords, setLifecycleRecords] = useState<readonly CompareFindingLifecycleRecord[]>([]);
  const [softFailureMessage, setSoftFailureMessage] = useState<string | null>(null);

  useEffect(() => {
    const baseline = baselineRunId?.trim() ?? "";
    const target = targetRunId?.trim() ?? "";

    if (baseline.length === 0 || target.length === 0) {
      setLoading(false);
      setMetadata(null);
      setLifecycle(null);
      setLifecycleRecords([]);
      setSoftFailureMessage(null);
      return;
    }

    if (canonicalizeDemoRunId(baseline).toLowerCase() === canonicalizeDemoRunId(target).toLowerCase()) {
      setLoading(false);
      setMetadata(null);
      setLifecycle(null);
      setLifecycleRecords([]);
      setSoftFailureMessage(null);
      return;
    }

    let canceled = false;

    setLoading(true);
    setMetadata(null);
    setLifecycle(null);
    setLifecycleRecords([]);
    setSoftFailureMessage(null);

    async function load(): Promise<void> {
      try {
        const response = await compareRunsEndToEnd(baseline, target);
        const rawCorrelation = response.report?.findingCorrelation ?? null;
        const nextMetadata = coerceCompareFindingCorrelationMetadata(rawCorrelation);

        if (!canceled) {
          if (rawCorrelation !== null && rawCorrelation !== undefined && nextMetadata === null) {
            setMetadata(null);
            setLifecycle(null);
            setLifecycleRecords([]);
            setSoftFailureMessage("finding correlation metadata");
          } else {
            setMetadata(nextMetadata);
            setLifecycle(coerceCompareFindingLifecycleSummary(response.report?.findingLifecycle ?? null));
            setLifecycleRecords(
              coerceCompareFindingLifecycleRecords(response.report?.findingLifecycleRecords ?? null),
            );
            setSoftFailureMessage(null);
          }

          setLoading(false);
        }
      } catch {
        if (!canceled) {
          setMetadata(null);
          setLifecycle(null);
          setLifecycleRecords([]);
          setSoftFailureMessage("finding correlation metadata");
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [baselineRunId, targetRunId]);

  return { loading, metadata, lifecycle, lifecycleRecords, softFailureMessage };
}
