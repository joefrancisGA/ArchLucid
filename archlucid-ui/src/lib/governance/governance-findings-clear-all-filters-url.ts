import { GOVERNANCE_FINDINGS_SEARCH_PARAM } from "@/lib/governance/governance-findings-queue-search";
import {
  GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM,
  GOVERNANCE_FINDINGS_NL_STATUS_PARAM,
  GOVERNANCE_FINDINGS_NL_TITLE_PARAM,
} from "@/lib/governance/governance-findings-queue-nl-facets-url";
import { GOVERNANCE_FINDINGS_GROUP_BY_PARAM } from "@/lib/governance/governance-findings-group-by-url";
import { REVIEW_FINDINGS_JOB_VIEW_PARAM } from "@/lib/findings/review-findings-job-view-url";

/** Clears register, facet, and search filters while preserving review/architecture scope params. */
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

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
