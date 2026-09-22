import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { sponsorPreliminaryShareMutationBlockedReason } from "@/lib/pilots/sponsor-preliminary-share-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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

  try {
    await apiPostNoContent(path, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = sponsorPreliminaryShareMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
