"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_FINDING_JOB_VIEW,
  type FindingJobView} from "@/lib/findings/finding-job-view";
import { writeFindingJobViewToUrl } from "@/lib/findings/review-findings-job-view-url";
import {
  resolveReviewFindingsToolbarFilterFromSearchParam,
  writeReviewFindingsToolbarFilterToUrl} from "@/lib/findings/review-findings-toolbar-filter-url";
import {
  parseReviewFindingsToolbarSearchQuery,
  reviewFindingsToolbarSearchHrefFromSearch} from "@/lib/findings/review-findings-toolbar-search-url";
import {
  parseFindingsGroundingFilterFromSearch,
  parseFindingsOriginFilterFromSearch} from "@/lib/findings/findings-provenance-url";
import {
  parseReviewFindingsDomainFilterFromSearch,
  parseReviewFindingsOwnerFilterFromSearch,
  reviewFindingsDomainFilterHrefFromSearch,
  reviewFindingsOwnerFilterHrefFromSearch,
  reviewFindingsToolbarClearDomainHrefFromSearch,
  reviewFindingsToolbarClearOwnerHrefFromSearch} from "@/lib/findings/review-findings-toolbar-field-filters-url";
import { parseReviewFindingsToolbarSortFromSearch } from "@/lib/findings/review-findings-toolbar-sort-url";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import type {
  RunDetailFindingsFilterKind,
  RunDetailFindingsSortKind} from "@/components/findings/run-detail-findings-toolbar-presentation";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

function readCommittedSearchParams(): URLSearchParams {
  return new URLSearchParams(readWindowLocationSearch());
}

function readToolbarStateFromCommittedUrl(): {
  readonly searchQuery: string;
  readonly originFilter: FindingOriginFilter;
  readonly groundingFilter: FindingGroundingFilter;
  readonly ownerFilter: string;
  readonly domainFilter: string;
  readonly sort: RunDetailFindingsSortKind;
} {
  const params = readCommittedSearchParams();

  return {
    searchQuery: parseReviewFindingsToolbarSearchQuery(params.get("q")),
    originFilter: parseFindingsOriginFilterFromSearch(params.get("origin")),
    groundingFilter: parseFindingsGroundingFilterFromSearch(params.get("grounding")),
    ownerFilter: parseReviewFindingsOwnerFilterFromSearch(params.get("owner")),
    domainFilter: parseReviewFindingsDomainFilterFromSearch(params.get("domain")),
    sort: parseReviewFindingsToolbarSortFromSearch(params.get("findingsSort"))};
}

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
  const pathname = usePathname() ?? "";
  const initialFilter =
    options?.initialFilter ??
    resolveReviewFindingsToolbarFilterFromSearchParam(
      readCommittedSearchParams().get("findingsFilter"),
    );
  const initialFromUrl = readToolbarStateFromCommittedUrl();
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
  const [ownerFilter, setOwnerFilterState] = useState(initialFromUrl.ownerFilter);
  const [domainFilter, setDomainFilterState] = useState(initialFromUrl.domainFilter);
  const [searchQuery, setSearchQueryState] = useState(initialFromUrl.searchQuery);
  const [sort, setSortState] = useState<RunDetailFindingsSortKind>(initialFromUrl.sort);
  const [originFilter, setOriginFilterState] = useState<FindingOriginFilter>(initialFromUrl.originFilter);
  const [groundingFilter, setGroundingFilterState] = useState<FindingGroundingFilter>(initialFromUrl.groundingFilter);

  useEffect(() => {
    const syncFromCommittedUrl = (): void => {
      const next = readToolbarStateFromCommittedUrl();

      setSearchQueryState((current) => (current === next.searchQuery ? current : next.searchQuery));
      setOriginFilterState((current) => (current === next.originFilter ? current : next.originFilter));
      setGroundingFilterState((current) => (current === next.groundingFilter ? current : next.groundingFilter));
      setOwnerFilterState((current) => (current === next.ownerFilter ? current : next.ownerFilter));
      setDomainFilterState((current) => (current === next.domainFilter ? current : next.domainFilter));
      setSortState((current) => (current === next.sort ? current : next.sort));
    };

    syncFromCommittedUrl();
    window.addEventListener("popstate", syncFromCommittedUrl);

    return () => {
      window.removeEventListener("popstate", syncFromCommittedUrl);
    };
  }, []);

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      commitHrefIfChanged(
        reviewFindingsToolbarSearchHrefFromSearch(
          readCommittedSearchParams().toString(),
          pathname,
          searchQuery,
        ),
        { notify: false },
      );
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, searchQuery]);

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      commitHrefIfChanged(
        reviewFindingsOwnerFilterHrefFromSearch(
          readCommittedSearchParams().toString(),
          pathname,
          ownerFilter,
        ),
        { notify: false },
      );
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [ownerFilter, pathname]);

  useEffect(() => {
    if (pathname.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      commitHrefIfChanged(
        reviewFindingsDomainFilterHrefFromSearch(
          readCommittedSearchParams().toString(),
          pathname,
          domainFilter,
        ),
        { notify: false },
      );
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [domainFilter, pathname]);

  const setSearchQuery = useCallback((value: string): void => {
    setSearchQueryState(value);
  }, []);

  const setOwnerFilter = useCallback((value: string): void => {
    setOwnerFilterState(value);
  }, []);

  const clearOwnerFilter = useCallback((): void => {
    setOwnerFilterState("");

    if (pathname.length === 0) {
      return;
    }

    commitHrefIfChanged(
      reviewFindingsToolbarClearOwnerHrefFromSearch(readCommittedSearchParams().toString(), pathname),
      { notify: false },
    );
  }, [pathname]);

  const setDomainFilter = useCallback((value: string): void => {
    setDomainFilterState(value);
  }, []);

  const clearDomainFilter = useCallback((): void => {
    setDomainFilterState("");

    if (pathname.length === 0) {
      return;
    }

    commitHrefIfChanged(
      reviewFindingsToolbarClearDomainHrefFromSearch(readCommittedSearchParams().toString(), pathname),
      { notify: false },
    );
  }, [pathname]);

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
    setGroundingFilter};
}
