"use client";

import { useQueries } from "@tanstack/react-query";

import { getRunExplanationSummary } from "@/lib/api";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { resolveQuickDecisionFindingsForRunDetail } from "@/lib/quick-decision-summary-derive";
import {
  buildCompareSemanticSupportBandDeltaView,
  type CompareSemanticSupportBandDeltaView,
} from "@/lib/review-quality/compare-semantic-support-band-delta";
import {
  buildCompareClassificationBandDeltaView,
  type CompareClassificationBandDeltaView,
} from "@/lib/review-quality/compare-classification-band-delta";
import {
  buildCompareTreatmentBandDeltaView,
  type CompareTreatmentBandDeltaView,
} from "@/lib/review-quality/compare-treatment-band-delta";
import type { RunSummary } from "@/types/authority";

async function loadCompareRunFindings(runId: string) {
  const [bundle, explanationSummary] = await Promise.all([
    fetchRunDetailCriticalPageBundle(runId),
    getRunExplanationSummary(runId),
  ]);

  return resolveQuickDecisionFindingsForRunDetail(bundle.data.buyerSummary, explanationSummary);
}

export function useCompareSemanticSupportBandDelta(input: {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
  readonly baselineSummary: RunSummary | null;
  readonly targetSummary: RunSummary | null;
}): {
  readonly loading: boolean;
  readonly view: CompareSemanticSupportBandDeltaView | null;
  readonly classificationView: CompareClassificationBandDeltaView | null;
  readonly treatmentView: CompareTreatmentBandDeltaView | null;
} {
  const baselineRunId = input.baselineRunId?.trim() ?? "";
  const targetRunId = input.targetRunId?.trim() ?? "";
  const enabled = baselineRunId.length > 0 && targetRunId.length > 0;

  const queries = useQueries({
    queries: [
      {
        queryKey: ["operator", "compare", "semantic-band-findings", baselineRunId] as const,
        queryFn: () => loadCompareRunFindings(baselineRunId),
        enabled,
      },
      {
        queryKey: ["operator", "compare", "semantic-band-findings", targetRunId] as const,
        queryFn: () => loadCompareRunFindings(targetRunId),
        enabled,
      },
    ],
  });

  if (!enabled) {
    return { loading: false, view: null, classificationView: null, treatmentView: null };
  }

  const loading = queries.some((query) => query.isPending);

  if (loading || queries.some((query) => query.isError)) {
    return { loading, view: null, classificationView: null, treatmentView: null };
  }

  const baselineFindings = queries[0]?.data ?? [];
  const targetFindings = queries[1]?.data ?? [];

  return {
    loading: false,
    view: buildCompareSemanticSupportBandDeltaView({
      baselineFindings,
      targetFindings,
      baselineExecutionMode: input.baselineSummary?.structuralExecutionMode ?? null,
      targetExecutionMode: input.targetSummary?.structuralExecutionMode ?? null,
    }),
    classificationView: buildCompareClassificationBandDeltaView({
      baselineFindings,
      targetFindings,
    }),
    treatmentView: buildCompareTreatmentBandDeltaView({
      baselineFindings,
      targetFindings,
    }),
  };
}
