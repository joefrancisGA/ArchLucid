import { getArchitectureRequest, getRunDetail } from "@/lib/api";
import type { StatedConstraintContext } from "@/lib/review-quality/assumption-and-severity";
import { deriveStatedConstraintContextFromArchitectureRequest } from "@/lib/review-quality/stated-constraint-context";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";

/** Best-effort load of stated RTO/RPO/cost ceilings for severity calibration (TB-2319). */
export async function tryLoadStatedConstraintContextForRun(
  runId: string,
): Promise<StatedConstraintContext | null> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || shouldSkipLiveAuthorityRunScopedApi(trimmedRunId)) {
    return null;
  }

  try {
    const detailEnvelope = await getRunDetail(trimmedRunId);
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return null;
    }

    const requestId = coercedDetail.value.run.architectureRequestId?.trim() ?? "";

    if (requestId.length === 0) {
      return null;
    }

    const request = await getArchitectureRequest(requestId);

    return deriveStatedConstraintContextFromArchitectureRequest({
      constraints: request.constraints,
      inlineRequirements: request.inlineRequirements,
      intakeQuestionAnswers: (request as { intakeQuestionAnswers?: Record<string, string> }).intakeQuestionAnswers,
    });
  } catch {
    return null;
  }
}
