import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";
import { governanceFindingsGroupByHrefFromSearch } from "@/lib/governance/governance-findings-group-by-url";
import { governanceFindingsNlFacetsHrefFromSearch } from "@/lib/governance/governance-findings-queue-nl-facets-url";
import { reviewFindingsJobViewHrefFromSearch } from "@/lib/findings/review-findings-job-view-url";

export type FindingsSavedViewFilters = {
  registerFilter?: RiskRegisterFilter;
  jobView?: FindingJobView;
  nlFacets?: FindingsNaturalLanguageFacets;
  groupByResource?: boolean;
  scopedRunId?: string | null;
};

export type GovernanceFindingsWorkspaceSavedViewHrefInput = {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly groupByResource: boolean;
};

/** Builds a workspace findings URL from saved-view filters and clears review/architecture scope. */
export function governanceFindingsWorkspaceSavedViewHref(
  applied: GovernanceFindingsWorkspaceSavedViewHrefInput,
  pathname: string,
): string {
  let search = "";

  if (applied.registerFilter !== "all") {
    search = new URLSearchParams({ filter: applied.registerFilter }).toString();
  }

  let href = governanceFindingsGroupByHrefFromSearch(search, applied.groupByResource, pathname);
  search = href.includes("?") ? href.split("?")[1] ?? "" : "";
  href = reviewFindingsJobViewHrefFromSearch(search, pathname, applied.jobView);
  search = href.includes("?") ? href.split("?")[1] ?? "" : "";
  href = governanceFindingsNlFacetsHrefFromSearch(search, applied.nlFacets, pathname);

  const params = new URLSearchParams(href.includes("?") ? href.split("?")[1] ?? "" : "");
  params.delete("runId");
  params.delete("architectureId");

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Builds a run-scoped findings URL from saved-view filters and clears architecture scope. */
export function governanceFindingsRunScopedSavedViewHref(
  applied: GovernanceFindingsWorkspaceSavedViewHrefInput,
  pathname: string,
  runId: string,
): string {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return governanceFindingsWorkspaceSavedViewHref(applied, pathname);
  }

  const workspaceHref = governanceFindingsWorkspaceSavedViewHref(applied, pathname);
  const params = new URLSearchParams(workspaceHref.includes("?") ? workspaceHref.split("?")[1] ?? "" : "");
  params.set("runId", trimmedRunId);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function buildFindingsSavedViewPayload(input: {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly groupByResource: boolean;
  readonly scopedRunId: string | null;
}): OperatorSavedViewPayload {
  const filters: FindingsSavedViewFilters = {
    registerFilter: input.registerFilter,
    jobView: input.jobView,
    nlFacets: input.nlFacets,
    groupByResource: input.groupByResource,
    scopedRunId: input.scopedRunId,
  };

  return {
    filters: filters as unknown as Record<string, unknown>,
    sort: null,
    columnVisibility: null,
  };
}
