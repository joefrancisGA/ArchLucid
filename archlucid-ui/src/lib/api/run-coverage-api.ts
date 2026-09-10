import { apiPutJson } from "@/lib/api/http";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runCoverageAcknowledgementMutationBlockedReason } from "@/lib/runs/run-coverage-acknowledgement-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

export type RunCoverageAcknowledgementEntry = {
  policyPackId: string;
  excluded: boolean;
  exclusionReason?: string | null;
};

export type RunAcknowledgedCoverageDocument = {
  evaluationVersion: string;
  acknowledgedUtc: string;
  actorUserId: string;
  entries: RunCoverageAcknowledgementEntry[];
};

/** PUT /v1/runs/{runId}/coverage/acknowledgement — pin operator coverage before execute. */
export async function putRunCoverageAcknowledgement(
  runId: string,
  entries: readonly RunCoverageAcknowledgementEntry[],
): Promise<RunAcknowledgedCoverageDocument> {
  const normalizedRunId = runId.trim();

  try {
    return await apiPutJson<RunAcknowledgedCoverageDocument>(
      `/v1/runs/${normalizedRunId}/coverage/acknowledgement`,
      { entries: [...entries] },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runCoverageAcknowledgementMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
