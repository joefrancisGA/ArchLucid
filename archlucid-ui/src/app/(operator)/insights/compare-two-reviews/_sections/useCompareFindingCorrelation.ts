"use client";

import { useCompareFindingCorrelationQuery } from "@/hooks/use-compare-finding-correlation-query";
import type {
  CompareFindingCorrelationMetadata,
} from "@/lib/compare-finding-correlation";
import type {
  CompareFindingLifecycleRecord,
  CompareFindingLifecycleSummary,
} from "@/lib/compare-finding-lifecycle";
import type { CompareQualityDeltaCounts } from "@/lib/review-quality/compare-quality-delta";

export type CompareFindingCorrelationLoadState = {
  readonly loading: boolean;
  readonly metadata: CompareFindingCorrelationMetadata | null;
  readonly lifecycle: CompareFindingLifecycleSummary | null;
  readonly lifecycleRecords: readonly CompareFindingLifecycleRecord[];
  readonly compareQualityDelta: CompareQualityDeltaCounts | null;
  readonly softFailureMessage: string | null;
};

/**
 * Loads finding correlation metadata from the end-to-end compare report. Failures are soft — compare results still render.
 */
export function useCompareFindingCorrelation(
  baselineRunId: string | null,
  targetRunId: string | null,
): CompareFindingCorrelationLoadState {
  const query = useCompareFindingCorrelationQuery(baselineRunId, targetRunId);
  const baseline = baselineRunId?.trim() ?? "";
  const target = targetRunId?.trim() ?? "";
  const pairReady = baseline.length > 0 && target.length > 0;

  if (!pairReady) {
    return {
      loading: false,
      metadata: null,
      lifecycle: null,
      lifecycleRecords: [],
      compareQualityDelta: null,
      softFailureMessage: null,
    };
  }

  return {
    loading: query.isPending,
    metadata: query.data?.metadata ?? null,
    lifecycle: query.data?.lifecycle ?? null,
    lifecycleRecords: query.data?.lifecycleRecords ?? [],
    compareQualityDelta: query.data?.compareQualityDelta ?? null,
    softFailureMessage: query.data?.softFailureMessage ?? null,
  };
}
