"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_FINDING_JOB_VIEW,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { writeFindingJobViewToUrl } from "@/lib/findings/review-findings-job-view-url";
import {
  resolveReviewFindingsToolbarFilterFromSearchParam,
  writeReviewFindingsToolbarFilterToUrl,
} from "@/lib/findings/review-findings-toolbar-filter-url";
import {
  parseReviewFindingsToolbarSearchQuery,
  reviewFindingsToolbarSearchHrefFromSearch,
} from "@/lib/findings/review-findings-toolbar-search-url";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import type {
  RunDetailFindingsFilterKind,
  RunDetailFindingsSortKind,
} from "@/components/findings/run-detail-findings-toolbar-presentation";

export function useRunDetailFindingsToolbarState(options?: {
  readonly initialJobView?: FindingJobView;
  readonly initialFilter?: RunDetailFindingsFilterKind;
}): {
  readonly filter: RunDetailFindingsFilterKind;
  readonly setFilter: (filter: RunDetailFindingsFilterKind) => void;
  readonly jobView: FindingJobView;
  readonly setJobView: (jobView: FindingJobView) => void;
  readonly ownerFilter: string;
  readonly setOwnerFilter: (value: string) => void;
  readonly domainFilter: string;
  readonly setDomainFilter: (value: string) => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (value: string) => void;
  readonly sort: RunDetailFindingsSortKind;
  readonly setSort: (sort: RunDetailFindingsSortKind) => void;
  readonly originFilter: FindingOriginFilter;
  readonly setOriginFilter: (filter: FindingOriginFilter) => void;
  readonly groundingFilter: FindingGroundingFilter;
  readonly setGroundingFilter: (filter: FindingGroundingFilter) => void;
} {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const initialFilter =
    options?.initialFilter ??
    resolveReviewFindingsToolbarFilterFromSearchParam(searchParams?.get("findingsFilter"));
  const urlSearchQuery = parseReviewFindingsToolbarSearchQuery(searchParams?.get("q"));
  const [filter, setFilterState] = useState<RunDetailFindingsFilterKind>(initialFilter);
  const setFilter = useCallback((next: RunDetailFindingsFilterKind): void => {
    setFilterState(next);
    writeReviewFindingsToolbarFilterToUrl(next);
  }, []);
  const [jobView, setJobViewState] = useState<FindingJobView>(
    options?.initialJobView ?? DEFAULT_FINDING_JOB_VIEW,
  );
  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    writeFindingJobViewToUrl(next);
  }, []);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [searchQuery, setSearchQueryState] = useState(urlSearchQuery);
  const [sort, setSort] = useState<RunDetailFindingsSortKind>("trust-then-severity");
  const [originFilter, setOriginFilter] = useState<FindingOriginFilter>("all");
  const [groundingFilter, setGroundingFilter] = useState<FindingGroundingFilter>("all");

  useEffect(() => {
    setSearchQueryState(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextHref = reviewFindingsToolbarSearchHrefFromSearch(searchParams.toString(), pathname, searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, router, searchParams, searchQuery]);

  const setSearchQuery = useCallback((value: string): void => {
    setSearchQueryState(value);
  }, []);

  return {
    filter,
    setFilter,
    jobView,
    setJobView,
    ownerFilter,
    setOwnerFilter,
    domainFilter,
    setDomainFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    originFilter,
    setOriginFilter,
    groundingFilter,
    setGroundingFilter,
  };
}
