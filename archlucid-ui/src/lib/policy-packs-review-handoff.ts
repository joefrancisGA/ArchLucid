import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const POLICY_PACKS_REVIEW_ID_QUERY_PARAM = "reviewId";

export function buildPolicyPacksHrefWithReviewId(reviewId: string): string {
  const trimmed = reviewId.trim();

  if (trimmed.length === 0) {
    return GOVERNANCE_POLICY_PACKS_PATH;
  }

  const params = new URLSearchParams({ [POLICY_PACKS_REVIEW_ID_QUERY_PARAM]: trimmed });

  return `${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`;
}
