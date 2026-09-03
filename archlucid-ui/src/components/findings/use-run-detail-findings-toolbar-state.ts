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
import {
  parseFindingsGroundingFilterFromSearch,
  parseFindingsOriginFilterFromSearch,
} from "@/lib/findings/findings-provenance-url";
import {
  parseReviewFindingsDomainFilterFromSearch,
  parseReviewFindingsOwnerFilterFromSearch,
  reviewFindingsDomainFilterHrefFromSearch,
  reviewFindingsOwnerFilterHrefFromSearch,
  reviewFindingsToolbarClearDomainHrefFromSearch,
  reviewFindingsToolbarClearOwnerHrefFromSearch,
} from "@/lib/findings/review-findings-toolbar-field-filters-url";
import { parseReviewFindingsToolbarSortFromSearch } from "@/lib/findings/review-findings-toolbar-sort-url";
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
  readonly clearOwnerFilter: () => void;
  readonly domainFilter: string;
  readonly setDomainFilter: (value: string) => void;
  readonly clearDomainFilter: () => void;
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
  const urlOriginFilter = parseFindingsOriginFilterFromSearch(searchParams?.get("origin"));
  const urlGroundingFilter = parseFindingsGroundingFilterFromSearch(searchParams?.get("grounding"));
  const urlOwnerFilter = parseReviewFindingsOwnerFilterFromSearch(searchParams?.get("owner"));
  const urlDomainFilter = parseReviewFindingsDomainFilterFromSearch(searchParams?.get("domain"));
  const urlSort = parseReviewFindingsToolbarSortFromSearch(searchParams?.get("findingsSort"));
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
  const [ownerFilter, setOwnerFilterState] = useState(urlOwnerFilter);
  const [domainFilter, setDomainFilterState] = useState(urlDomainFilter);
  const [searchQuery, setSearchQueryState] = useState(urlSearchQuery);
  const [sort, setSortState] = useState<RunDetailFindingsSortKind>(urlSort);
  const [originFilter, setOriginFilterState] = useState<FindingOriginFilter>(urlOriginFilter);
  const [groundingFilter, setGroundingFilterState] = useState<FindingGroundingFilter>(urlGroundingFilter);

  useEffect(() => {
    setSearchQueryState(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    setOriginFilterState(urlOriginFilter);
  }, [urlOriginFilter]);

  useEffect(() => {
    setGroundingFilterState(urlGroundingFilter);
  }, [urlGroundingFilter]);

  useEffect(() => {
    setOwnerFilterState(urlOwnerFilter);
  }, [urlOwnerFilter]);

  useEffect(() => {
    setDomainFilterState(urlDomainFilter);
  }, [urlDomainFilter]);

  useEffect(() => {
    setSortState(urlSort);
  }, [urlSort]);

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

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextHref = reviewFindingsOwnerFilterHrefFromSearch(searchParams.toString(), pathname, ownerFilter);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [ownerFilter, pathname, router, searchParams]);

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextHref = reviewFindingsDomainFilterHrefFromSearch(searchParams.toString(), pathname, domainFilter);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [domainFilter, pathname, router, searchParams]);

  const setSearchQuery = useCallback((value: string): void => {
    setSearchQueryState(value);
  }, []);

  const setOwnerFilter = useCallback((value: string): void => {
    setOwnerFilterState(value);
  }, []);

  const clearOwnerFilter = useCallback((): void => {
    setOwnerFilterState("");
    router.replace(reviewFindingsToolbarClearOwnerHrefFromSearch(searchParams.toString(), pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const setDomainFilter = useCallback((value: string): void => {
    setDomainFilterState(value);
  }, []);

  const clearDomainFilter = useCallback((): void => {
    setDomainFilterState("");
    router.replace(reviewFindingsToolbarClearDomainHrefFromSearch(searchParams.toString(), pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const setSort = useCallback((value: RunDetailFindingsSortKind): void => {
    setSortState(value);
  }, []);

  const setOriginFilter = useCallback((value: FindingOriginFilter): void => {
    setOriginFilterState(value);
  }, []);

  const setGroundingFilter = useCallback((value: FindingGroundingFilter): void => {
    setGroundingFilterState(value);
  }, []);

  return {
    filter,
    setFilter,
    jobView,
    setJobView,
    ownerFilter,
    setOwnerFilter,
    clearOwnerFilter,
    domainFilter,
    setDomainFilter,
    clearDomainFilter,
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
