import { apiPostJson } from "@/lib/api";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingMergeConflictBlockedReason } from "@/lib/findings/finding-merge-conflict-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

export type FindingMergeConflictResolutionAction = "AcceptPrimary" | "AcceptAlternate" | "KeepBoth";

/** Resolves a finding merge conflict row on the authority findings snapshot. */
export async function resolveFindingMergeConflict(
  runId: string,
  findingId: string,
  action: FindingMergeConflictResolutionAction,
): Promise<void> {
  try {
    await apiPostJson<void>(
      `/v1/governance/runs/${encodeURIComponent(runId)}/finding-merge-conflicts/${encodeURIComponent(findingId)}/resolve`,
      { action },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingMergeConflictBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
