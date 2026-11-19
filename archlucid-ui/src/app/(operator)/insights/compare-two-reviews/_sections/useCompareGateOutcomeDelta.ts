"use client";

import { useCompareProvenanceTrailsQuery } from "@/hooks/use-compare-provenance-trails-query";
import {
  buildCompareGateOutcomeDeltaView,
  compareGateOutcomeBothKindsMissing,
  type CompareGateOutcomeDeltaView,
} from "@/lib/review-quality/compare-gate-outcome-delta";

export function useCompareGateOutcomeDelta(input: {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
}): {
  readonly loading: boolean;
  readonly view: CompareGateOutcomeDeltaView | null;
  readonly gateOutcomeBothMissing: boolean;
  readonly gateOutcomeLoadFailed: boolean;
} {
  const baselineRunId = input.baselineRunId?.trim() ?? "";
  const targetRunId = input.targetRunId?.trim() ?? "";
  const query = useCompareProvenanceTrailsQuery(baselineRunId, targetRunId);

  if (baselineRunId.length === 0 || targetRunId.length === 0) {
    return { loading: false, view: null, gateOutcomeBothMissing: false, gateOutcomeLoadFailed: false };
  }

  if (query.isPending) {
    return { loading: true, view: null, gateOutcomeBothMissing: false, gateOutcomeLoadFailed: false };
  }

  if (query.isError || query.data === undefined) {
    return { loading: false, view: null, gateOutcomeBothMissing: false, gateOutcomeLoadFailed: true };
  }

  const kinds = {
    baselineKind: query.data.baseline.feasibilityVerdictKind,
    targetKind: query.data.target.feasibilityVerdictKind,
  };

  return {
    loading: false,
    view: buildCompareGateOutcomeDeltaView(kinds),
    gateOutcomeBothMissing: compareGateOutcomeBothKindsMissing(kinds),
    gateOutcomeLoadFailed: false,
  };
}
