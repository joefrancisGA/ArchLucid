"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  DEFAULT_FINDING_JOB_VIEW,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { writeFindingJobViewToUrl } from "@/lib/findings/review-findings-job-view-url";
import {
  resolveReviewFindingsToolbarFilterFromSearchParam,
  writeReviewFindingsToolbarFilterToUrl,
} from "@/lib/findings/review-findings-toolbar-filter-url";
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
  const searchParams = useSearchParams();
  const initialFilter =
    options?.initialFilter ??
    resolveReviewFindingsToolbarFilterFromSearchParam(searchParams?.get("findingsFilter"));
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<RunDetailFindingsSortKind>("trust-then-severity");
  const [originFilter, setOriginFilter] = useState<FindingOriginFilter>("all");
  const [groundingFilter, setGroundingFilter] = useState<FindingGroundingFilter>("all");

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
