import { apiPostNoContent } from "@/lib/api/http";

export type RecordSponsorPreliminaryArchitectureShareRequest = {
  readonly readinessStatus: string;
  readonly knownGaps: readonly string[];
  readonly overrideAcknowledged: boolean;
  readonly confidentialityLabel: string | null;
  readonly deliveryMethod: string;
};

/** POST `/v1/pilots/runs/{runId}/sponsor-preliminary-share` — audit trail for preliminary sponsor sharing. */
export async function recordSponsorPreliminaryArchitectureShare(
  runId: string,
  body: RecordSponsorPreliminaryArchitectureShareRequest,
): Promise<void> {
  const path = `/v1/pilots/runs/${encodeURIComponent(runId)}/sponsor-preliminary-share`;
  await apiPostNoContent(path, body);
}
