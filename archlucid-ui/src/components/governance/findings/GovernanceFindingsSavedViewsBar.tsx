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
  const source =
    filters !== null &&
    typeof filters === "object" &&
    !Array.isArray(filters)
      ? (filters as Record<string, unknown>)
      : {};
  const nlFacets =
    source.nlFacets !== null &&
    typeof source.nlFacets === "object" &&
    !Array.isArray(source.nlFacets)
      ? normalizeFindingsNaturalLanguageFacets(source.nlFacets as Record<string, unknown>)
      : {};

  return {
    registerFilter: (typeof source.registerFilter === "string" ? source.registerFilter : "all") as RiskRegisterFilter,
    jobView: (typeof source.jobView === "string" ? source.jobView : DEFAULT_FINDING_JOB_VIEW) as FindingJobView,
    nlFacets,
    groupByResource: source.groupByResource === true,
    scopedRunId: typeof source.scopedRunId === "string" ? source.scopedRunId : null,
  };
}

function normalizeFindingsNaturalLanguageFacets(
  value: Record<string, unknown>,
): FindingsNaturalLanguageFacets {
  const hasKnownFacet = "severity" in value || "status" in value || "titleKeywords" in value;

  if (!hasKnownFacet) {
    return {};
  }

  const severity = value.severity;
  const status = value.status;
  const titleKeywords = value.titleKeywords;

  return {
    severity:
      severity === "critical" || severity === "high" || severity === "medium" || severity === "low"
        ? severity
        : null,
    status: status === "open" || status === "disposed" ? status : null,
    titleKeywords: Array.isArray(titleKeywords)
      ? titleKeywords.filter((keyword): keyword is string => typeof keyword === "string")
      : [],
  };
}
