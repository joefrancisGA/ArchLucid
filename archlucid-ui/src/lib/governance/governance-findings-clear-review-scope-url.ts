import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "@/lib/governance/governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "@/lib/governance/governance-findings-bulk-selection-url";

/** Removes review scope from the findings queue URL while preserving register and facet filters. */
export function governanceFindingsClearReviewScopeHref(
  currentSearch: string,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  params.delete("runId");
  params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
  params.delete(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
