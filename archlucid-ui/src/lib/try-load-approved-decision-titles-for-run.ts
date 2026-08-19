import { getRunDetail, getRunExplanationSummary } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { tryStaticDemoExplanationSummary } from "@/lib/operator/operator-static-demo";
import { resolveQuickDecisionFindingsForRunDetail } from "@/lib/quick-decision-summary-derive";
import { deriveApprovedDecisionTitlesFromFindings } from "@/lib/review-quality/finalize-quality-scorecard-from-findings";

/** Best-effort approved decision titles for apply-change override checks on inspect routes (TB-2316). */
export async function tryLoadApprovedDecisionTitlesForRun(runId: string): Promise<readonly string[]> {
  try {
    const detailEnvelope = await getRunDetail(runId.trim());
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
