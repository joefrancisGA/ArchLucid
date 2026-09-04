import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_APPROVAL_ID_PARAM = "approvalId";
export const GOVERNANCE_REVIEW_MODE_PARAM = "reviewMode";

export const GOVERNANCE_REVIEW_MODE_OPTIONS = ["approve", "reject"] as const;

export type GovernanceApprovalReviewMode = (typeof GOVERNANCE_REVIEW_MODE_OPTIONS)[number];

const GOVERNANCE_REVIEW_MODE_IDS = new Set<string>(GOVERNANCE_REVIEW_MODE_OPTIONS);

export type GovernanceApprovalReviewUrlState = {
  readonly approvalRequestId: string;
  readonly mode: GovernanceApprovalReviewMode;
};

export function parseGovernanceApprovalIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseGovernanceReviewModeFromSearch(
  raw: string | null | undefined,
): GovernanceApprovalReviewMode | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!GOVERNANCE_REVIEW_MODE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as GovernanceApprovalReviewMode;
}

export function governanceApprovalReviewHrefFromSearch(
  currentSearch: string,
  review: GovernanceApprovalReviewUrlState | null,
  pathname: string = GOVERNANCE_APPROVAL_QUEUE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (review === null) {
    params.delete(GOVERNANCE_APPROVAL_ID_PARAM);
    params.delete(GOVERNANCE_REVIEW_MODE_PARAM);
  } else {
    const approvalRequestId = review.approvalRequestId.trim();
    const mode = review.mode;

    if (approvalRequestId.length === 0 || mode === null) {
      params.delete(GOVERNANCE_APPROVAL_ID_PARAM);
      params.delete(GOVERNANCE_REVIEW_MODE_PARAM);
    } else {
      params.set(GOVERNANCE_APPROVAL_ID_PARAM, approvalRequestId);
      params.set(GOVERNANCE_REVIEW_MODE_PARAM, mode);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
