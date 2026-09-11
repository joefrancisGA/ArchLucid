import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACKS_REVIEW_ID_QUERY_PARAM = "reviewId";

export const POLICY_PACKS_PACK_A_ID_QUERY_PARAM = "packAId";

export const POLICY_PACKS_PACK_B_ID_QUERY_PARAM = "packBId";

export type PolicyPacksImpactPreviewHandoff = {
  readonly reviewId?: string | null;
  readonly packAId?: string | null;
  readonly packBId?: string | null;
};

export function buildPolicyPacksImpactPreviewHref(handoff: PolicyPacksImpactPreviewHandoff): string {
  const params = new URLSearchParams();
  const reviewId = handoff.reviewId?.trim() ?? "";
  const packAId = handoff.packAId?.trim() ?? "";
  const packBId = handoff.packBId?.trim() ?? "";

  if (reviewId.length > 0) {
    params.set(POLICY_PACKS_REVIEW_ID_QUERY_PARAM, reviewId);
  }

  if (packAId.length > 0) {
    params.set(POLICY_PACKS_PACK_A_ID_QUERY_PARAM, packAId);
  }

  if (packBId.length > 0) {
    params.set(POLICY_PACKS_PACK_B_ID_QUERY_PARAM, packBId);
  }

  const query = params.toString();

  if (query.length === 0) {
    return GOVERNANCE_POLICY_PACKS_PATH;
  }

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${query}`;
}

export function buildPolicyPacksHrefWithReviewId(reviewId: string): string {
  return buildPolicyPacksImpactPreviewHref({ reviewId });
}

export function resolveCompareGovernancePackImpactHandoff(
  targetRunId: string,
  baselinePackId: string | null | undefined,
  targetPackId: string | null | undefined,
): PolicyPacksImpactPreviewHandoff {
  return {
    reviewId: targetRunId.trim(),
    packAId: baselinePackId?.trim() ?? "",
    packBId: targetPackId?.trim() ?? "",
  };
}
