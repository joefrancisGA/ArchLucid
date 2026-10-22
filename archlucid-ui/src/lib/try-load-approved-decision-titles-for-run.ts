import { getRunDetail, getRunExplanationSummary } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { tryStaticDemoExplanationSummary, tryStaticRunDetailCriticalPageBundle } from "@/lib/operator/operator-static-demo";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { resolveQuickDecisionFindingsForRunDetail } from "@/lib/quick-decision-summary-derive";
import { deriveApprovedDecisionTitlesFromFindings } from "@/lib/review-quality/finalize-quality-scorecard-from-findings";

/** Best-effort approved decision titles for apply-change override checks on inspect routes (TB-2316). */
export async function tryLoadApprovedDecisionTitlesForRun(runId: string): Promise<readonly string[]> {
  const trimmedRunId = runId.trim();

  try {
    const staticBundle = shouldSkipLiveAuthorityRunScopedApi(trimmedRunId)
      ? tryStaticRunDetailCriticalPageBundle(trimmedRunId)
      : null;
    const detailEnvelope =
      staticBundle !== null
        ? { data: staticBundle.buyerSummary, traceId: null }
        : await getRunDetail(trimmedRunId);
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return [];
    }

    let explanationSummary = null;

    try {
      explanationSummary = await getRunExplanationSummary(runId);
    } catch {
      explanationSummary = tryStaticDemoExplanationSummary(runId);
    }

    const findings = resolveQuickDecisionFindingsForRunDetail(coercedDetail.value, explanationSummary);

    return deriveApprovedDecisionTitlesFromFindings(findings);
  } catch {
    return [];
  }
}
