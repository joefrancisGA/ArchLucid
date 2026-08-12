import { tryStaticDemoGovernanceApprovalLineage } from "@/lib/operator-static-demo";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

function isBlank(value: string | null | undefined): boolean {
  return (value ?? "").trim().length === 0;
}

/**
 * API lineage payloads can succeed with empty linkage — treat as incomplete so curated demo data can backfill.
 */
export function isGovernanceLineageIncomplete(data: GovernanceLineageResult): boolean {
  const approval = data.approvalRequest;

  if (isBlank(approval.status) || isBlank(approval.requestedBy)) {
    return true;
  }

  if (data.topFindings.length === 0 && data.promotions.length === 0) {
    return true;
  }

  return false;
}

/**
 * Prefer curated showcase lineage when live API data is missing or incomplete for buyer/demo shells.
 */
export function resolveGovernanceApprovalLineage(
  approvalRequestId: string,
  apiResult: GovernanceLineageResult | null,
): GovernanceLineageResult | null {
  const fallback = tryStaticDemoGovernanceApprovalLineage(approvalRequestId);

  if (apiResult === null) {
    return fallback;
  }

  if (fallback !== null && isGovernanceLineageIncomplete(apiResult)) {
    return fallback;
  }

  return apiResult;
}
