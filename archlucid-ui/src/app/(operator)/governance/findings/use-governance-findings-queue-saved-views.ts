"use client";

import { useCallback } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

import { applyFindingsSavedViewFilters } from "@/components/governance/findings/GovernanceFindingsSavedViewsBar";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { FindingsSavedViewFilters } from "@/lib/operator/operator-saved-view-types";
import {
  DEFAULT_FINDING_JOB_VIEW,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import { governanceFindingsSearchHrefFromSearch } from "@/lib/governance/governance-findings-queue-search";

export type UseGovernanceFindingsQueueSavedViewsInput = {
  readonly mode: string;
  readonly navHref: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly router: AppRouterInstance;
  readonly setRegisterFilter: (next: RiskRegisterFilter) => void;
  readonly setJobView: (next: FindingJobView) => void;
  readonly setNlFacets: (next: FindingsNaturalLanguageFacets) => void;
  readonly applyGroupByResource: (next: boolean) => void;
  readonly onPickReviewForTriage: (reviewId: string) => void;
  readonly clearFacetFilters: () => void;
};

export function useGovernanceFindingsQueueSavedViews({
  mode,
  navHref,
  searchParams,
  router,
  setRegisterFilter,
  setJobView,
  setNlFacets,
  applyGroupByResource,
  onPickReviewForTriage,
  clearFacetFilters,
}: UseGovernanceFindingsQueueSavedViewsInput) {
  const clearAllFilters = useCallback((): void => {
    setRegisterFilter("all");
    clearFacetFilters();
    router.replace(governanceFindingsSearchHrefFromSearch(searchParams.toString(), "", navHref), { scroll: false });
  }, [clearFacetFilters, navHref, router, searchParams, setRegisterFilter]);

  const dismissActiveFilterChip = useCallback(
    (chipId: string): void => {
      if (chipId === "search-query") {
        router.replace(governanceFindingsSearchHrefFromSearch(searchParams.toString(), "", navHref), { scroll: false });
        return;
      }

      if (chipId.startsWith("register-")) {
        setRegisterFilter("all");
        return;
      }

      if (chipId.startsWith("job-view-")) {
        setJobView(DEFAULT_FINDING_JOB_VIEW);
        return;
      }

      if (chipId === "nl-facets") {
        setNlFacets(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
      }
    },
    [mode, navHref, router, searchParams, setJobView, setNlFacets, setRegisterFilter],
  );

  const onLoadFindingsSavedView = useCallback(
    (view: OperatorSavedView) => {
      const filters = view.payload.filters as FindingsSavedViewFilters;
      const applied = applyFindingsSavedViewFilters(filters);

      setRegisterFilter(applied.registerFilter);
      setJobView(applied.jobView);
      setNlFacets(applied.nlFacets);
      applyGroupByResource(applied.groupByResource);

      if (applied.scopedRunId !== null && applied.scopedRunId.trim().length > 0) {
        onPickReviewForTriage(applied.scopedRunId);
      }
    },
    [applyGroupByResource, onPickReviewForTriage, setJobView, setNlFacets, setRegisterFilter],
  );

  return {
    clearAllFilters,
    dismissActiveFilterChip,
    onLoadFindingsSavedView,
  };
}
