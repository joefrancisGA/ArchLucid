"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { resolveContinueLastSignedRecordsListRow } from "@/lib/resolve-continue-last-signed-record";
import type { SignedRecordsListDateRangePreset } from "@/lib/signed-records/signed-records-list-date-range-url";
import {
  resolveSignedRecordsFilterEmphasizedStepId,
  resolveSignedRecordsFilterSteps,
} from "@/lib/signed-records-filter-checklist";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";

import { useSignedRecordsListEnrichment } from "./use-signed-records-list-enrichment";
import { useSignedRecordsListFetch } from "./use-signed-records-list-fetch";
import { useSignedRecordsListFilters } from "./use-signed-records-list-filters";
import type { SignedRecordsListRow } from "./signed-records-list-row";
import type { SignedRecordsListIntegrityFilter } from "./SignedRecordsListToolbar";

export type UseSignedRecordsListClientResult = {
  readonly scopedRunId: string;
  readonly scopedRunFilterActive: boolean;
  readonly rows: readonly SignedRecordsListRow[];
  readonly loading: boolean;
  readonly enriching: boolean;
  readonly enrichmentFailed: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly usedStaticFallback: boolean;
  readonly retryingRunId: string | null;
  readonly retryFailedRunId: string | null;
  readonly retrySucceededRunId: string | null;
  readonly searchQuery: string;
  readonly setSearchQuery: Dispatch<SetStateAction<string>>;
  readonly integrityFilter: SignedRecordsListIntegrityFilter;
  readonly setIntegrityFilter: Dispatch<SetStateAction<SignedRecordsListIntegrityFilter>>;
  readonly dateRangePreset: SignedRecordsListDateRangePreset | null;
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly onIntegrityFilterChange: (value: SignedRecordsListIntegrityFilter) => void;
  readonly onDateRangePresetChange: (value: SignedRecordsListDateRangePreset | null) => void;
  readonly onCustomFromUtcChange: (value: string) => void;
  readonly onCustomToUtcChange: (value: string) => void;
  readonly page: number;
  readonly cursor: string;
  readonly hasMore: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onPickReviewForFiltering: (reviewId: string) => void;
  readonly loadRows: (request: { readonly page: number; readonly cursor: string }) => Promise<void>;
  readonly retryRow: (runId: string) => Promise<void>;
  readonly goToNextPage: () => void;
  readonly goToPreviousPage: () => void;
  readonly hasRows: boolean;
  readonly isInitialLoad: boolean;
  readonly isPageRefresh: boolean;
  readonly filteredRows: readonly SignedRecordsListRow[];
  readonly continueLastViewedRow: ReturnType<typeof resolveContinueLastSignedRecordsListRow>;
  readonly filtersActive: boolean;
  readonly showFilterNoMatch: boolean;
  readonly showEmptyState: boolean;
  readonly showPagination: boolean;
  readonly showListChrome: boolean;
  readonly showcaseSampleAvailable: boolean;
  readonly workspaceScopeTeaching: ReturnType<typeof resolveWorkspaceScopeEmptyTeachingForHub>;
  readonly freshnessLabel: string;
  readonly signedRecordsFilterChecklistSteps: ReturnType<typeof resolveSignedRecordsFilterSteps>;
  readonly signedRecordsFilterChecklistEmphasizedStepId: ReturnType<typeof resolveSignedRecordsFilterEmphasizedStepId>;
  readonly cursorHistoryLength: number;
  readonly nextCursor: string | null;
  readonly clearFilters: () => void;
};

export function useSignedRecordsListClient(): UseSignedRecordsListClientResult {
  const enrichRowsRef = useRef<
    (baseRows: readonly SignedRecordsListRow[], canApplyState: () => boolean) => Promise<void>
  >(async () => {});
  const resetRetryStateRef = useRef<() => void>(() => {});
  const clearLocalFiltersRef = useRef<() => void>(() => {});

  const fetch = useSignedRecordsListFetch({
    enrichRows: (baseRows, canApplyState) => enrichRowsRef.current(baseRows, canApplyState),
    resetRetryState: () => resetRetryStateRef.current(),
    onPaginationPageChange: () => clearLocalFiltersRef.current(),
  });

  const enrichment = useSignedRecordsListEnrichment({
    rows: fetch.rows,
    setRows: fetch.setRows,
    mountedRef: fetch.mountedRef,
  });

  enrichRowsRef.current = enrichment.enrichRows;
  resetRetryStateRef.current = enrichment.resetRetryState;

  const filters = useSignedRecordsListFilters({
    rows: fetch.rows,
    loading: fetch.loading,
    hasRows: fetch.hasRows,
    lastRefreshedAt: fetch.lastRefreshedAt,
    showEmptyState: fetch.showEmptyState,
  });

  clearLocalFiltersRef.current = filters.clearLocalFilters;

  return {
    scopedRunId: filters.scopedRunId,
    scopedRunFilterActive: filters.scopedRunFilterActive,
    rows: fetch.rows,
    loading: fetch.loading,
    enriching: enrichment.enriching,
    enrichmentFailed: enrichment.enrichmentFailed,
    loadFailure: fetch.loadFailure,
    usedStaticFallback: fetch.usedStaticFallback,
    retryingRunId: enrichment.retryingRunId,
    retryFailedRunId: enrichment.retryFailedRunId,
    retrySucceededRunId: enrichment.retrySucceededRunId,
    searchQuery: filters.searchQuery,
    setSearchQuery: filters.setSearchQuery,
    integrityFilter: filters.integrityFilter,
    setIntegrityFilter: filters.setIntegrityFilter,
    dateRangePreset: filters.dateRangePreset,
    fromUtc: filters.fromUtc,
    toUtc: filters.toUtc,
    onIntegrityFilterChange: filters.onIntegrityFilterChange,
    onDateRangePresetChange: filters.onDateRangePresetChange,
    onCustomFromUtcChange: filters.onCustomFromUtcChange,
    onCustomToUtcChange: filters.onCustomToUtcChange,
    page: fetch.page,
    cursor: fetch.cursor,
    hasMore: fetch.hasMore,
    lastRefreshedAt: fetch.lastRefreshedAt,
    onPickReviewForFiltering: filters.onPickReviewForFiltering,
    loadRows: fetch.loadRows,
    retryRow: enrichment.retryRow,
    goToNextPage: fetch.goToNextPage,
    goToPreviousPage: fetch.goToPreviousPage,
    hasRows: fetch.hasRows,
    isInitialLoad: fetch.isInitialLoad,
    isPageRefresh: fetch.isPageRefresh,
    filteredRows: filters.filteredRows,
    continueLastViewedRow: filters.continueLastViewedRow,
    filtersActive: filters.filtersActive,
    showFilterNoMatch: filters.showFilterNoMatch,
    showEmptyState: fetch.showEmptyState,
    showPagination: fetch.showPagination,
    showListChrome: fetch.showListChrome,
    showcaseSampleAvailable: filters.showcaseSampleAvailable,
    workspaceScopeTeaching: filters.workspaceScopeTeaching,
    freshnessLabel: filters.freshnessLabel,
    signedRecordsFilterChecklistSteps: filters.signedRecordsFilterChecklistSteps,
    signedRecordsFilterChecklistEmphasizedStepId: filters.signedRecordsFilterChecklistEmphasizedStepId,
    cursorHistoryLength: fetch.cursorHistoryLength,
    nextCursor: fetch.nextCursor,
    clearFilters: filters.clearFilters,
  };
}
