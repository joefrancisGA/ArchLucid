import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runCoverageAcknowledgementMutationBlockedReason } from "@/lib/runs/run-coverage-acknowledgement-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPatchJson, apiPutJson } from "./http";

import { apiPutJson } from "@/lib/api/http";

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

/** GET /v1/runs/{runId}/coverage/acknowledgement — operator pinned coverage acknowledgement rows. */
export async function getRunCoverageAcknowledgement(
  runId: string,
): Promise<RunAcknowledgedCoverageDocument> {
  const normalizedRunId = runId.trim();

  try {
    return await apiGetSealedManifestAware<RunAcknowledgedCoverageDocument>(
      `/v1/runs/${normalizedRunId}/coverage/acknowledgement`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runCoverageAcknowledgementMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

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

/** PATCH /v1/runs/{runId}/coverage/{policyPackId} — update one pack exclusion row. */
export async function patchRunCoveragePack(
  runId: string,
  policyPackId: string,
  body: { excluded: boolean; exclusionReason?: string | null },
): Promise<RunCoverageAcknowledgementEntry> {
  const normalizedRunId = runId.trim();
  const normalizedPackId = policyPackId.trim();

  try {
    return await apiPatchJson<RunCoverageAcknowledgementEntry>(
      `/v1/runs/${normalizedRunId}/coverage/${encodeURIComponent(normalizedPackId)}`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runCoverageAcknowledgementMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
