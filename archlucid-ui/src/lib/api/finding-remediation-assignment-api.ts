import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingRemediationAssignmentBlockedReason } from "@/lib/findings/finding-remediation-assignment-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPutNoContent } from "@/lib/api/http";

export type FindingRemediationAssignmentRequest = {
  runId: string;
  assignedToUserId?: string | null;
  remediationDueUtc?: string | null;
};

export async function upsertFindingRemediationAssignment(
  findingId: string,
  body: FindingRemediationAssignmentRequest,
): Promise<void> {
  try {
    await apiPutNoContent(`/v1/findings/${encodeURIComponent(findingId)}/remediation-assignment`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingRemediationAssignmentBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
