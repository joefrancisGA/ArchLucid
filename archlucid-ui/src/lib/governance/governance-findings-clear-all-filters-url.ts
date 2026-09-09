import { GOVERNANCE_FINDINGS_SEARCH_PARAM } from "@/lib/governance/governance-findings-queue-search";
import {
  GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM,
  GOVERNANCE_FINDINGS_NL_STATUS_PARAM,
  GOVERNANCE_FINDINGS_NL_TITLE_PARAM,
} from "@/lib/governance/governance-findings-queue-nl-facets-url";
import { GOVERNANCE_FINDINGS_GROUP_BY_PARAM } from "@/lib/governance/governance-findings-group-by-url";
import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "@/lib/governance/governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "@/lib/governance/governance-findings-bulk-selection-url";
import { governanceFindingsHideGenericHrefFromSearch } from "@/lib/governance/governance-findings-hide-generic-url";
import { REVIEW_FINDINGS_JOB_VIEW_PARAM } from "@/lib/findings/review-findings-job-view-url";

/** Clears register, facet, search, and bulk-selection params while preserving review/architecture scope. */
export function governanceFindingsClearAllFiltersHref(
  currentSearch: string,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  params.delete("filter");
  params.delete(GOVERNANCE_FINDINGS_SEARCH_PARAM);
  params.delete(REVIEW_FINDINGS_JOB_VIEW_PARAM);
  params.delete(GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM);
  params.delete(GOVERNANCE_FINDINGS_NL_STATUS_PARAM);
  params.delete(GOVERNANCE_FINDINGS_NL_TITLE_PARAM);
  params.delete(GOVERNANCE_FINDINGS_GROUP_BY_PARAM);
  params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
  params.delete(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Clears register, facet, search, bulk-selection, and hide-generic params while preserving review/architecture scope. */
export function governanceFindingsShowAllFilteredFindingsHref(
  currentSearch: string,
  pathname: string,
): string {
  const clearedFilters = governanceFindingsClearAllFiltersHref(currentSearch, pathname);
  const query = clearedFilters.includes("?") ? clearedFilters.split("?")[1] ?? "" : "";

  return governanceFindingsHideGenericHrefFromSearch(query, false, pathname);
}
