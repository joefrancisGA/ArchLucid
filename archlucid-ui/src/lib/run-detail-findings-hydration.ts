import { getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator-response-guards";
import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-summary-derive";
import type { RunDetail } from "@/types/authority";

/**
 * Buyer-summary (TB-283) omits agent `results[].findings`. Merge only that slice from operator run detail
 * so QuickDecisionSummary and policy traceability badges still render in buyer-polished shells.
 */
function trimmedGoldenManifestId(run: RunDetail["run"]): string {
  return run.goldenManifestId?.trim() ?? "";
}

export async function mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
  runId: string,
  buyerSummaryDetail: RunDetail,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetail> {
  const buyerHasFindings = extractQuickDecisionFindingsFromRunDetail(buyerSummaryDetail).length > 0;
  const buyerGoldenManifestId = trimmedGoldenManifestId(buyerSummaryDetail.run);

  if (buyerHasFindings && buyerGoldenManifestId.length > 0) {
    return buyerSummaryDetail;
  }

  try {
    const operatorDetailResponse = await getRunDetail(runId, options);
    const operatorEnvelope = coerceRunDetail(operatorDetailResponse.data);

    if (!operatorEnvelope.ok) {
      return buyerSummaryDetail;
    }

    const operatorResults = operatorEnvelope.value.results;
    const buyerRun = buyerSummaryDetail.run;
    const operatorRun = operatorEnvelope.value.run;
    const operatorGoldenManifestId = trimmedGoldenManifestId(operatorRun);

    const mergedResults =
      buyerHasFindings || !Array.isArray(operatorResults) || operatorResults.length === 0
        ? buyerSummaryDetail.results
        : operatorResults;

    const mergedGoldenManifestId =
      buyerGoldenManifestId.length > 0
        ? buyerRun.goldenManifestId
        : operatorGoldenManifestId.length > 0
          ? operatorRun.goldenManifestId
          : buyerRun.goldenManifestId;

    if (mergedResults === buyerSummaryDetail.results && mergedGoldenManifestId === buyerRun.goldenManifestId) {
      return buyerSummaryDetail;
    }

    return {
      ...buyerSummaryDetail,
      run: {
        ...buyerRun,
        goldenManifestId: mergedGoldenManifestId,
      },
      results: mergedResults,
    };
  } catch {
    return buyerSummaryDetail;
  }
}
