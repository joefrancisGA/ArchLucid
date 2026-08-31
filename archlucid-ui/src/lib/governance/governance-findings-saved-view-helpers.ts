import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";

export type FindingsSavedViewFilters = {
  registerFilter?: RiskRegisterFilter;
  jobView?: FindingJobView;
  nlFacets?: FindingsNaturalLanguageFacets;
  groupByResource?: boolean;
  scopedRunId?: string | null;
};

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
