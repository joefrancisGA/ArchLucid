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

/** PUT /v1/runs/{runId}/coverage/acknowledgement — pin operator coverage before execute. */
export async function putRunCoverageAcknowledgement(
  runId: string,
  entries: readonly RunCoverageAcknowledgementEntry[],
): Promise<RunAcknowledgedCoverageDocument> {
  const normalizedRunId = runId.trim();

  return apiPutJson<RunAcknowledgedCoverageDocument>(
    `/v1/runs/${normalizedRunId}/coverage/acknowledgement`,
    { entries: [...entries] },
  );
}
