"use client";

import { useCallback, useState } from "react";

import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import { patchGovernanceFindingsQueueFacets, readGovernanceFindingsQueueFacets } from "@/lib/governance/governance-findings-queue-facets-storage";
import { DEFAULT_FINDING_JOB_VIEW, type FindingJobView } from "@/lib/findings/finding-job-view";

export function useGovernanceFindingsQueueFacets(mode: GovernanceFindingsQueueMode) {
  const [jobView, setJobViewState] = useState<FindingJobView>(
    () => readGovernanceFindingsQueueFacets(mode).jobView,
  );
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () => readGovernanceFindingsQueueFacets(mode).nlFacets,
  );

  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    patchGovernanceFindingsQueueFacets({ jobView: next }, mode);
  }, [mode]);

  const setNlFacets = useCallback((next: FindingsNaturalLanguageFacets): void => {
    setNlFacetsState(next);
    patchGovernanceFindingsQueueFacets({ nlFacets: next }, mode);
  }, [mode]);

  const clearFacetFilters = useCallback((): void => {
    setJobViewState(DEFAULT_FINDING_JOB_VIEW);
    setNlFacetsState(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
    patchGovernanceFindingsQueueFacets(
      {
        registerFilter: "all",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      },
      mode,
    );
  }, [mode]);

  return { jobView, setJobView, nlFacets, setNlFacets, clearFacetFilters };
}
