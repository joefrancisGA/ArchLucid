import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { sponsorPreliminaryShareMutationBlockedReason } from "@/lib/pilots/sponsor-preliminary-share-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPostNoContent } from "@/lib/api/http";

import {
  encodeRequiredPathSegment,
  trimOptionalText,
  trimStringList,
  trimTextFields,
} from "./api-boundary-normalization";

export type RecordSponsorPreliminaryArchitectureShareRequest = {
  readonly readinessStatus: string;
  readonly knownGaps: readonly string[];
  readonly overrideAcknowledged: boolean;
  readonly confidentialityLabel: string | null;
  readonly deliveryMethod: string;
};

/** Trims the share record: blank gaps are dropped and a blank confidentiality label becomes null. */
function normalizeSponsorShare(
  body: RecordSponsorPreliminaryArchitectureShareRequest,
): RecordSponsorPreliminaryArchitectureShareRequest {
  return {
    ...trimTextFields(body, ["readinessStatus", "deliveryMethod"]),
    knownGaps: trimStringList(body.knownGaps),
    confidentialityLabel: trimOptionalText(body.confidentialityLabel) ?? null,
  };
}

/** POST `/v1/pilots/runs/{runId}/sponsor-preliminary-share` — audit trail for preliminary sponsor sharing. */
export async function recordSponsorPreliminaryArchitectureShare(
  runId: string,
  body: RecordSponsorPreliminaryArchitectureShareRequest,
): Promise<void> {
  const path = `/v1/pilots/runs/${encodeRequiredPathSegment(runId, "runId")}/sponsor-preliminary-share`;
  const normalizedBody = normalizeSponsorShare(body);

  try {
    await apiPostNoContent(path, normalizedBody);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = sponsorPreliminaryShareMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
