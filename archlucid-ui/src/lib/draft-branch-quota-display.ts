import type { DraftBranchQuotaResponse } from "@/types/draft-intake";
import { BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL } from "@/lib/vocabulary/billing-meter-vocabulary";

function finiteQuotaField(value: number | string | undefined | null): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim().length > 0 ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

/** Operator-facing summary for what-if branch quota and estimated run cost (estimate — SAQ-011, UU-502). */
export function formatDraftBranchQuotaSummary(quota: DraftBranchQuotaResponse): string {
  const used = finiteQuotaField(quota.existingBranchCount);
  const max = finiteQuotaField(quota.maxBranchesPerParent);
  const remaining = finiteQuotaField(quota.remainingBranches);
  const estimated = finiteQuotaField(quota.estimatedBranchRunCostUsd);

  const branchUsage =
    used !== null && max !== null ? `${used}/${max}` : "Not returned";

  const remainingLabel =
    remaining === null
      ? "remaining: Not returned"
      : remaining === 0
        ? "No branches left"
        : `${remaining} remaining`;

  const estimatedCost =
    estimated !== null
      ? `Estimated ~$${estimated.toFixed(2)} AI spend per branch run`
      : "Estimated cost not returned";

  return `${estimatedCost} · Branches used: ${branchUsage} · ${remainingLabel} · each submit runs one billable ${BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL} (full pipeline).`;
}
