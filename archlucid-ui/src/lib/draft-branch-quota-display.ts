import type { DraftBranchQuotaResponse } from "@/types/draft-intake";

/** Operator-facing summary for what-if branch quota and estimated run cost (estimate — SAQ-011). */
export function formatDraftBranchQuotaSummary(quota: DraftBranchQuotaResponse): string {
  const estimated = Number(quota.estimatedBranchRunCostUsd);
  const cost = (Number.isFinite(estimated) ? estimated : 0).toFixed(2);

  return `Branches used: ${quota.existingBranchCount}/${quota.maxBranchesPerParent} · ${quota.remainingBranches} remaining · each submit runs the full pipeline (~$${cost} estimated from AI budget).`;
}
