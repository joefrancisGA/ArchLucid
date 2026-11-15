import { getArchitectureRequest, getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import {
  derivePriorPackageGuidedIntakePrefill,
  type PriorPackageGuidedIntakePrefill,
} from "@/lib/prior-package-guided-intake-prefill";

/** Loads guided-intake prefill, returning null when no prior request is available. */
export async function tryLoadPriorPackageGuidedIntakePrefill(
  runId: string,
): Promise<PriorPackageGuidedIntakePrefill | null> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || shouldSkipLiveAuthorityRunScopedApi(trimmedRunId)) {
    return null;
  }

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

  return derivePriorPackageGuidedIntakePrefill({
    systemName: request.systemName,
    description: request.description,
    draftActors: request.draftActors?.map((a) => ({ ...a, label: a.label ?? undefined })),
    inlineRequirements: request.inlineRequirements,
  });
}
