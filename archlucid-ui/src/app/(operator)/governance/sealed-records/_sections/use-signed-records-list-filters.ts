"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { areSpineStaticDemoPayloadsAvailable } from "@/lib/operator/operator-static-demo";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { resolveContinueLastSignedRecordsListRow } from "@/lib/resolve-continue-last-signed-record";
import {
  parseSignedRecordsListDateRangeFromSearch,
  signedRecordsListDateRangeHrefFromSearch,
  type SignedRecordsListDateRangePreset,
} from "@/lib/signed-records/signed-records-list-date-range-url";
import {
  parseSignedRecordsListIntegrityFilter,
  signedRecordsListIntegrityHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-integrity-url";
import {
  parseSignedRecordsListSearchQuery,
  signedRecordsListSearchHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-search";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import {
  resolveSignedRecordsFilterEmphasizedStepId,
  resolveSignedRecordsFilterSteps,
} from "@/lib/signed-records-filter-checklist";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";

import { filterSignedRecordsListRows } from "./signed-records-list-client-filter";
import { SIGNED_RECORDS_LIST_LAST_REFRESHED_PREFIX } from "./signed-records-list-copy";
import type { SignedRecordsListRow } from "./signed-records-list-row";
import type { SignedRecordsListIntegrityFilter } from "./SignedRecordsListToolbar";

export function useSignedRecordsListFilters(options: {
  readonly rows: readonly SignedRecordsListRow[];
  readonly loading: boolean;
  readonly hasRows: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly showEmptyState: boolean;
}) {
  const { rows, loading, hasRows, lastRefreshedAt, showEmptyState } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const urlDateRange = parseSignedRecordsListDateRangeFromSearch(searchParams.get("range"));
  const urlIntegrity = parseSignedRecordsListIntegrityFilter(searchParams.get("integrity"));
  const urlSearchQuery = parseSignedRecordsListSearchQuery(searchParams.get("q"));

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [integrityFilter, setIntegrityFilter] = useState<SignedRecordsListIntegrityFilter>(urlIntegrity);
  const [dateRangePreset, setDateRangePreset] = useState<SignedRecordsListDateRangePreset | null>(urlDateRange);
  const scopeRecord = useOperatorScopeRecord();

  useEffect(() => {
    setIntegrityFilter(urlIntegrity);
  }, [urlIntegrity]);

  useEffect(() => {
    setDateRangePreset(urlDateRange);
  }, [urlDateRange]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = signedRecordsListSearchHrefFromSearch(searchParams.toString(), searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [router, searchParams, searchQuery]);

  const clearLocalFilters = useCallback(() => {
    setSearchQuery("");
    setIntegrityFilter("all");
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setIntegrityFilter("all");
    setDateRangePreset(null);
    router.replace(
      signedRecordsListSearchHrefFromSearch(
        signedRecordsListDateRangeHrefFromSearch(
          signedRecordsListIntegrityHrefFromSearch(searchParams.toString(), "all"),
          null,
        ),
        "",
      ),
      { scroll: false },
    );
  }, [router, searchParams]);

  const onPickReviewForFiltering = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${SIGNED_RECORDS_LIST_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const onIntegrityFilterChange = useCallback(
    (value: SignedRecordsListIntegrityFilter) => {
      setIntegrityFilter(value);
      router.replace(signedRecordsListIntegrityHrefFromSearch(searchParams.toString(), value), { scroll: false });
    },
    [router, searchParams],
  );

  const onDateRangePresetChange = useCallback(
    (value: SignedRecordsListDateRangePreset | null) => {
      setDateRangePreset(value);
      router.replace(signedRecordsListDateRangeHrefFromSearch(searchParams.toString(), value), { scroll: false });
    },
    [router, searchParams],
  );

  const filteredRows = useMemo(
    () =>
      filterSignedRecordsListRows(
        rows,
        searchQuery,
        integrityFilter,
        scopedRunFilterActive ? scopedRunId : null,
        dateRangePreset,
      ),
    [dateRangePreset, integrityFilter, rows, scopedRunFilterActive, scopedRunId, searchQuery],
  );
  const continueLastViewedRow = useMemo(() => resolveContinueLastSignedRecordsListRow(rows), [rows]);
  const filtersActive =
    searchQuery.trim().length > 0 || integrityFilter !== "all" || dateRangePreset !== null;
  const showFilterNoMatch = !loading && hasRows && filtersActive && filteredRows.length === 0;
  const showcaseSampleAvailable = areSpineStaticDemoPayloadsAvailable();
  const workspaceScopeTeaching = resolveWorkspaceScopeEmptyTeachingForHub({
    listEmpty: showEmptyState,
    scopeRecord,
    objectPlural: "finalized review records",
  });
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: SIGNED_RECORDS_LIST_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: loading ? null : lastRefreshedAt,
    refreshingLabel: loading ? "Refreshing…" : null,
  });
  const signedRecordsFilterChecklistSteps = resolveSignedRecordsFilterSteps({
    reviewPicked: scopedRunFilterActive,
    recordsLoaded: scopedRunFilterActive && hasRows && !loading,
    filterReady: scopedRunFilterActive && hasRows && filteredRows.length > 0 && !loading,
  });
  const signedRecordsFilterChecklistEmphasizedStepId = resolveSignedRecordsFilterEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    recordsLoaded: scopedRunFilterActive && hasRows && !loading,
    filterReady: scopedRunFilterActive && hasRows && filteredRows.length > 0 && !loading,
  });

  return {
    scopedRunId,
    scopedRunFilterActive,
    searchQuery,
    setSearchQuery: setSearchQuery as Dispatch<SetStateAction<string>>,
    integrityFilter,
    setIntegrityFilter: setIntegrityFilter as Dispatch<SetStateAction<SignedRecordsListIntegrityFilter>>,
    dateRangePreset,
    onIntegrityFilterChange,
    onDateRangePresetChange,
    onPickReviewForFiltering,
    clearFilters,
    clearLocalFilters,
    filteredRows,
    continueLastViewedRow,
    filtersActive,
    showFilterNoMatch,
    showcaseSampleAvailable,
    workspaceScopeTeaching,
    freshnessLabel,
    signedRecordsFilterChecklistSteps,
    signedRecordsFilterChecklistEmphasizedStepId,
  };
}
