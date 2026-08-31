"use client";

import { useCallback } from "react";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import { buildFindingsSavedViewPayload } from "@/lib/governance/governance-findings-saved-view-helpers";
import type { FindingsSavedViewFilters } from "@/lib/operator/operator-saved-view-types";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import {
  DEFAULT_FINDING_JOB_VIEW,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";

export type GovernanceFindingsSavedViewsBarProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly groupByResource: boolean;
  readonly scopedRunId: string | null;
  readonly onLoadView: (view: OperatorSavedView) => void;
};

/** Tenant/user saved views for the architecture risk register (findings queue). */
export function GovernanceFindingsSavedViewsBar(props: GovernanceFindingsSavedViewsBarProps) {
  const getCurrentPayload = useCallback(
    () =>
      buildFindingsSavedViewPayload({
        registerFilter: props.registerFilter,
        jobView: props.jobView,
        nlFacets: props.nlFacets,
        groupByResource: props.groupByResource,
        scopedRunId: props.scopedRunId,
      }),
    [props.groupByResource, props.jobView, props.nlFacets, props.registerFilter, props.scopedRunId],
  );

  const onLoadView = useCallback(
    async (view: OperatorSavedView) => {
      props.onLoadView(view);
    },
    [props],
  );

  return (
    <OperatorSavedViewsBar
      surface="findings"
      getCurrentPayload={getCurrentPayload}
      onLoadView={onLoadView}
      className="mb-3"
    />
  );
}

export function applyFindingsSavedViewFilters(
  filters: FindingsSavedViewFilters,
): {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly groupByResource: boolean;
  readonly scopedRunId: string | null;
} {
  return {
    registerFilter: (filters.registerFilter ?? "all") as RiskRegisterFilter,
    jobView: (filters.jobView ?? DEFAULT_FINDING_JOB_VIEW) as FindingJobView,
    nlFacets: (filters.nlFacets ?? {}) as FindingsNaturalLanguageFacets,
    groupByResource: filters.groupByResource === true,
    scopedRunId: filters.scopedRunId ?? null,
  };
}
