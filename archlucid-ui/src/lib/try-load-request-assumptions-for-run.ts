import { getArchitectureRequest, getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";

/** Best-effort load of architecture-request assumptions for review assumption strip (TB-2314). */
export async function tryLoadRequestAssumptionsForRun(runId: string): Promise<readonly string[]> {
  try {
    const detailEnvelope = await getRunDetail(runId.trim());
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return [];
    }

    const requestId = coercedDetail.value.run.architectureRequestId?.trim() ?? "";

    if (requestId.length === 0) {
      return [];
    }

    const request = await getArchitectureRequest(requestId);
    const assumptions = request.assumptions ?? [];

    return assumptions
      .map((assumption) => assumption.trim())
      .filter((assumption) => assumption.length > 0);
  } catch {
    return [];
  }
}
