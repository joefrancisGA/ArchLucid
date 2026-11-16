import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingRemediationAssignmentBlockedReason } from "@/lib/findings/finding-remediation-assignment-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPutNoContent } from "@/lib/api/http";

import { encodeRequiredPathSegment, trimRequiredText, trimTextFields } from "./api-boundary-normalization";

export type FindingRemediationAssignmentRequest = {
  runId: string;
  assignedToUserId?: string | null;
  remediationDueUtc?: string | null;
};

/** Trims the assignment body. Null assignee and due date pass through, because null clears them. */
function normalizeRemediationAssignment(
  body: FindingRemediationAssignmentRequest,
): FindingRemediationAssignmentRequest {
  return {
    ...trimTextFields(body, ["assignedToUserId", "remediationDueUtc"]),
    runId: trimRequiredText(body.runId, "runId"),
  };
}

export async function upsertFindingRemediationAssignment(
  findingId: string,
  body: FindingRemediationAssignmentRequest,
): Promise<void> {
  const encodedFindingId = encodeRequiredPathSegment(findingId, "findingId");
  const normalizedBody = normalizeRemediationAssignment(body);

  try {
    await apiPutNoContent(`/v1/findings/${encodedFindingId}/remediation-assignment`, normalizedBody);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingRemediationAssignmentBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
