import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "@/lib/governance/governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "@/lib/governance/governance-findings-bulk-selection-url";

/** Sets review scope on the findings queue URL and clears conflicting architecture scope. */
export function governanceFindingsPickReviewForTriageHref(
  currentSearch: string,
  pathname: string,
  reviewId: string,
): string {
  const trimmedReviewId = reviewId.trim();

  if (trimmedReviewId.length === 0) {
    return pathname;
  }

  const currentParams = new URLSearchParams(currentSearch);
  const hadArchitectureScope = currentParams.has("architectureId");
  const params = hadArchitectureScope
    ? new URLSearchParams()
    : new URLSearchParams(currentSearch);

  params.set("runId", trimmedReviewId);
  params.delete("architectureId");
  params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
  params.delete(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
