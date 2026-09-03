"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import { patchGovernanceFindingsQueueFacets, readGovernanceFindingsQueueFacets } from "@/lib/governance/governance-findings-queue-facets-storage";
import { DEFAULT_FINDING_JOB_VIEW, type FindingJobView } from "@/lib/findings/finding-job-view";
import {
  governanceFindingsNlFacetsFromSearchParams,
  governanceFindingsNlFacetsHrefFromSearch,
} from "@/lib/governance/governance-findings-queue-nl-facets-url";
import {
  resolveFindingJobViewFromSearchParam,
  REVIEW_FINDINGS_JOB_VIEW_PARAM,
  reviewFindingsJobViewHrefFromSearch,
} from "@/lib/findings/review-findings-job-view-url";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

function governanceFindingsQueuePathname(mode: GovernanceFindingsQueueMode): string {
  return mode === "assigned-to-me" ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH;
}

export function useGovernanceFindingsQueueFacets(mode: GovernanceFindingsQueueMode) {
  const router = useRouter();
  const pathname = usePathname() ?? governanceFindingsQueuePathname(mode);
  const searchParams = useSearchParams();
  const urlJobView = resolveFindingJobViewFromSearchParam(searchParams.get(REVIEW_FINDINGS_JOB_VIEW_PARAM));
  const urlNlFacets = governanceFindingsNlFacetsFromSearchParams(searchParams);
  const [jobView, setJobViewState] = useState<FindingJobView>(() => {
    const fromUrl = resolveFindingJobViewFromSearchParam(searchParams.get(REVIEW_FINDINGS_JOB_VIEW_PARAM));

    if (fromUrl !== DEFAULT_FINDING_JOB_VIEW || searchParams.has(REVIEW_FINDINGS_JOB_VIEW_PARAM)) {
      return fromUrl;
    }

    return readGovernanceFindingsQueueFacets(mode).jobView;
  });
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () =>
      urlNlFacets.severity !== null || urlNlFacets.status !== null || urlNlFacets.titleKeywords.length > 0
        ? urlNlFacets
        : readGovernanceFindingsQueueFacets(mode).nlFacets,
  );

  useEffect(() => {
    setJobViewState(urlJobView);
  }, [urlJobView]);

  useEffect(() => {
    if (urlNlFacets.severity !== null || urlNlFacets.status !== null || urlNlFacets.titleKeywords.length > 0) {
      setNlFacetsState(urlNlFacets);
    }
  }, [urlNlFacets]);

  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    patchGovernanceFindingsQueueFacets({ jobView: next }, mode);
    router.replace(reviewFindingsJobViewHrefFromSearch(searchParams.toString(), pathname, next), { scroll: false });
  }, [mode, pathname, router, searchParams]);

  const setNlFacets = useCallback((next: FindingsNaturalLanguageFacets): void => {
    setNlFacetsState(next);
    patchGovernanceFindingsQueueFacets({ nlFacets: next }, mode);
    router.replace(governanceFindingsNlFacetsHrefFromSearch(searchParams.toString(), next, pathname), { scroll: false });
  }, [mode, pathname, router, searchParams]);

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
    router.replace(reviewFindingsJobViewHrefFromSearch(
      governanceFindingsNlFacetsHrefFromSearch(searchParams.toString(), EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS, pathname),
      pathname,
      DEFAULT_FINDING_JOB_VIEW,
    ), { scroll: false });
  }, [mode, pathname, router, searchParams]);

  return { jobView, setJobView, nlFacets, setNlFacets, clearFacetFilters };
}
