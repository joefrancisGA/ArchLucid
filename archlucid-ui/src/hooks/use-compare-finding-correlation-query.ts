"use client";

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
import { coerceCompareQualityDeltaCounts, type CompareQualityDeltaCounts } from "@/lib/review-quality/compare-quality-delta";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type CompareFindingCorrelationQueryData = {
  readonly metadata: CompareFindingCorrelationMetadata | null;
  readonly lifecycle: CompareFindingLifecycleSummary | null;
  readonly lifecycleRecords: readonly CompareFindingLifecycleRecord[];
  readonly compareQualityDelta: CompareQualityDeltaCounts | null;
  readonly softFailureMessage: string | null;
};

async function fetchCompareFindingCorrelation(
  baselineRunId: string,
  targetRunId: string,
): Promise<CompareFindingCorrelationQueryData> {
  try {
    const response = await compareRunsEndToEnd(baselineRunId, targetRunId);
    const rawCorrelation = response.report?.findingCorrelation ?? null;
    const nextMetadata = coerceCompareFindingCorrelationMetadata(rawCorrelation);

    if (rawCorrelation !== null && rawCorrelation !== undefined && nextMetadata === null) {
      return {
        metadata: null,
        lifecycle: null,
        lifecycleRecords: [],
        compareQualityDelta: null,
        softFailureMessage: "finding correlation metadata",
      };
    }

    return {
      metadata: nextMetadata,
      lifecycle: coerceCompareFindingLifecycleSummary(response.report?.findingLifecycle ?? null),
      lifecycleRecords: coerceCompareFindingLifecycleRecords(response.report?.findingLifecycleRecords ?? null),
      compareQualityDelta: coerceCompareQualityDeltaCounts(response.report?.compareQualityDelta ?? null),
      softFailureMessage: null,
    };
  } catch {
    return {
      metadata: null,
      lifecycle: null,
      lifecycleRecords: [],
      compareQualityDelta: null,
      softFailureMessage: "finding correlation metadata",
    };
  }
}

function isComparePairEnabled(baselineRunId: string | null, targetRunId: string | null): boolean {
  const baseline = baselineRunId?.trim() ?? "";
  const target = targetRunId?.trim() ?? "";

  if (baseline.length === 0 || target.length === 0) {
    return false;
  }

  return canonicalizeDemoRunId(baseline).toLowerCase() !== canonicalizeDemoRunId(target).toLowerCase();
}

export function useCompareFindingCorrelationQuery(
  baselineRunId: string | null,
  targetRunId: string | null,
) {
  const baseline = baselineRunId?.trim() ?? "";
  const target = targetRunId?.trim() ?? "";
  const enabled = isComparePairEnabled(baselineRunId, targetRunId);

  return createOperatorQueryHook<CompareFindingCorrelationQueryData>({
    queryKey: operatorQueryKeys.compareRunsEndToEnd(baseline, target),
    queryFn: () => fetchCompareFindingCorrelation(baseline, target),
    enabled,
  });
}
