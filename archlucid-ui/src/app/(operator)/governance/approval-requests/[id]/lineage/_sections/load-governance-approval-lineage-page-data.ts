import { getApprovalRequestLineage } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { tryStaticDemoGovernanceApprovalLineage } from "@/lib/operator-static-demo";
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

    return { approvalRequestId, data: result, failure: null };
  } catch (e: unknown) {
    const fallback = tryStaticDemoGovernanceApprovalLineage(approvalRequestId);

    if (fallback !== null) {
      return { approvalRequestId, data: fallback, failure: null };
    }

    return { approvalRequestId, data: null, failure: toApiLoadFailure(e) };
  }
}
