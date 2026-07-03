import { getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator-response-guards";
import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-summary-derive";
import type { RunDetail } from "@/types/authority";

/**
 * Buyer-summary (TB-283) omits agent `results[].findings`. Merge only that slice from operator run detail
 * so QuickDecisionSummary and policy traceability badges still render in buyer-polished shells.
 */
export async function mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
  runId: string,
  buyerSummaryDetail: RunDetail,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetail> {
  if (extractQuickDecisionFindingsFromRunDetail(buyerSummaryDetail).length > 0) {
    return buyerSummaryDetail;
  }

  try {
    const operatorDetailResponse = await getRunDetail(runId, options);
    const operatorEnvelope = coerceRunDetail(operatorDetailResponse.data);

    if (!operatorEnvelope.ok) {
      return buyerSummaryDetail;
    }

    const operatorResults = operatorEnvelope.value.results;

    if (!Array.isArray(operatorResults) || operatorResults.length === 0) {
      return buyerSummaryDetail;
    }

    const buyerRun = buyerSummaryDetail.run;
    const operatorRun = operatorEnvelope.value.run;

    return {
      ...buyerSummaryDetail,
      run: {
        ...buyerRun,
        goldenManifestId: buyerRun.goldenManifestId ?? operatorRun.goldenManifestId,
      },
      results: operatorResults,
    };
  } catch {
    return buyerSummaryDetail;
  }
}
