import { apiPostJson } from "@/lib/api";

export type FindingMergeConflictResolutionAction = "AcceptPrimary" | "AcceptAlternate" | "KeepBoth";

/** Resolves a finding merge conflict row on the authority findings snapshot. */
export async function resolveFindingMergeConflict(
  runId: string,
  findingId: string,
  action: FindingMergeConflictResolutionAction,
): Promise<void> {
  await apiPostJson<void>(
    `/v1/governance/runs/${encodeURIComponent(runId)}/finding-merge-conflicts/${encodeURIComponent(findingId)}/resolve`,
    { action },
  );
}
