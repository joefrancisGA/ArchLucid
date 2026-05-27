import { getApprovalRequestLineage } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { resolveGovernanceApprovalLineage } from "@/lib/governance-lineage-demo-fallback";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

export type GovernanceApprovalLineagePageServerLoad = {
  readonly approvalRequestId: string;
  readonly data: GovernanceLineageResult | null;
  readonly failure: ApiLoadFailureState | null;
};

export async function loadGovernanceApprovalLineagePageData(
  approvalRequestIdRaw: string,
): Promise<GovernanceApprovalLineagePageServerLoad> {
  const approvalRequestId = approvalRequestIdRaw.trim();

  if (approvalRequestId === "") {
    return { approvalRequestId, data: null, failure: null };
  }

  try {
    const result = await getApprovalRequestLineage(approvalRequestId);
    const resolved = resolveGovernanceApprovalLineage(approvalRequestId, result);

    return { approvalRequestId, data: resolved, failure: null };
  } catch (e: unknown) {
    const fallback = resolveGovernanceApprovalLineage(approvalRequestId, null);

    if (fallback !== null) {
      return { approvalRequestId, data: fallback, failure: null };
    }

    return { approvalRequestId, data: null, failure: toApiLoadFailure(e) };
  }
}
