"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { areSpineStaticDemoPayloadsAvailable, tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { resolveContinueLastSignedRecordsListRow } from "@/lib/resolve-continue-last-signed-record";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import {
  resolveSignedRecordsFilterEmphasizedStepId,
  resolveSignedRecordsFilterSteps,
} from "@/lib/signed-records-filter-checklist";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";

import { filterSignedRecordsListRows } from "./signed-records-list-client-filter";
import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import {
  formatSignedRecordsListRecordCount,
  SIGNED_RECORDS_LIST_LAST_REFRESHED_PREFIX,
} from "./signed-records-list-copy";
import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";
import type { SignedRecordsListIntegrityFilter } from "./SignedRecordsListToolbar";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [usedStaticFallback, setUsedStaticFallback] = useState(false);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [retryFailedRunId, setRetryFailedRunId] = useState<string | null>(null);
  const [retrySucceededRunId, setRetrySucceededRunId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [integrityFilter, setIntegrityFilter] = useState<SignedRecordsListIntegrityFilter>("all");
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState("");
  const [cursorHistory, setCursorHistory] = useState<readonly string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const scopeRecord = useOperatorScopeRecord();
  const loadRowsRequestVersionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

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

  const loadRows = useCallback(async (request: { readonly page: number; readonly cursor: string }) => {
    const requestVersion = loadRowsRequestVersionRef.current + 1;
    loadRowsRequestVersionRef.current = requestVersion;
    const canApplyState = () => mountedRef.current && loadRowsRequestVersionRef.current === requestVersion;

    setLoading(true);
    setLoadFailure(null);
    setEnrichmentFailed(false);
    setUsedStaticFallback(false);
    setRetryFailedRunId(null);
    setRetrySucceededRunId(null);

    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, request.page, SIGNED_RECORDS_LIST_PAGE_SIZE, {
        cursor: request.cursor,
        scopeHeaders,
      });
      const coerced = coerceRunSummaryPaged(raw, { page: request.page });

      if (!canApplyState()) {
        return;
      }

      if (!coerced.ok) {
        setRows([]);
        setHasMore(false);
        setNextCursor(null);
        setLoadFailure({
          message: coerced.message,
          problem: null,
          correlationId: null,
          httpStatus: null,
          retryAfterSeconds: null,
        });

        return;
      }

      let runs = coerced.value.items;
      let staticFallbackUsed = false;
      const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

      if (runs.length === 0 && staticFallback !== null) {
        runs = staticFallback.items;
        staticFallbackUsed = true;
      }

      setUsedStaticFallback(staticFallbackUsed);

      const baseRows = buildSignedRecordsListRowsFromRuns(runs);
      setRows(baseRows);
      setHasMore(coerced.value.hasMore);
      setNextCursor(coerced.value.nextCursor ?? null);
      setLastRefreshedAt(new Date());
      setLoading(false);
      setEnriching(true);

      try {
        const enrichedRows = await enrichSignedRecordsListRows(baseRows);

        if (!canApplyState()) {
          return;
        }

        setRows(enrichedRows);
      } catch {
        // Enrichment is best-effort; keep baseRows visible when manifest lookup fails.
        if (!canApplyState()) {
          return;
        }

        setEnrichmentFailed(true);
      }
    } catch (error: unknown) {
      if (!canApplyState()) {
        return;
      }

      setRows([]);
      setHasMore(false);
      setNextCursor(null);
      setLoadFailure(toApiLoadFailure(error));
    } finally {
      if (!canApplyState()) {
        return;
      }

      setEnriching(false);
      setLoading(false);
    }
  }, []);

  const retryRow = useCallback(async (runId: string) => {
    const existingRow = rows.find((row) => row.runId === runId);

    if (existingRow === undefined) {
      return;
    }

    setRetryingRunId(runId);
    setRetryFailedRunId(null);
    setRetrySucceededRunId(null);

    try {
      const [enrichedRow] = await enrichSignedRecordsListRows([existingRow]);

      if (!mountedRef.current) {
        return;
      }

      setRows((currentRows) => currentRows.map((row) => (row.runId === runId ? enrichedRow : row)));

      if (enrichedRow.recordLookupFailure !== null || enrichedRow.signedRecordHref === null) {
        setRetryFailedRunId(runId);
      } else {
        setRetrySucceededRunId(runId);
      }
    } catch {
      if (!mountedRef.current) {
        return;
      }

      setRetryFailedRunId(runId);
    } finally {
      if (!mountedRef.current) {
        return;
      }

      setRetryingRunId(null);
    }
  }, [rows]);

  useEffect(() => {
    void loadRows({ page, cursor });
  }, [cursor, loadRows, page]);

  const goToNextPage = useCallback(() => {
    if (nextCursor === null || nextCursor.length === 0) {
      return;
    }

    setCursorHistory((history) => [...history, cursor]);
    setCursor(nextCursor);
    setPage((currentPage) => currentPage + 1);
    setSearchQuery("");
    setIntegrityFilter("all");
  }, [cursor, nextCursor]);

  const goToPreviousPage = useCallback(() => {
    if (cursorHistory.length === 0) {
      return;
    }

    const previousCursor = cursorHistory[cursorHistory.length - 1];

    setCursorHistory((history) => history.slice(0, -1));
    setCursor(previousCursor);
    setPage((currentPage) => Math.max(1, currentPage - 1));
    setSearchQuery("");
    setIntegrityFilter("all");
  }, [cursorHistory]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setIntegrityFilter("all");
  }, []);

  const hasRows = rows.length > 0;
  const isInitialLoad = loading && !hasRows;
  const isPageRefresh = loading && hasRows;
  const filteredRows = useMemo(
    () => filterSignedRecordsListRows(rows, searchQuery, integrityFilter, scopedRunFilterActive ? scopedRunId : null),
    [integrityFilter, rows, scopedRunFilterActive, scopedRunId, searchQuery],
  );
  const continueLastViewedRow = useMemo(() => resolveContinueLastSignedRecordsListRow(rows), [rows]);
  const filtersActive = searchQuery.trim().length > 0 || integrityFilter !== "all";
  const showFilterNoMatch = !loading && hasRows && filtersActive && filteredRows.length === 0;
  const showEmptyState = !loading && !hasRows && loadFailure === null;
  const showPagination = loadFailure === null && (loading || hasRows || page > 1 || hasMore);
  const showListChrome = loadFailure === null && (loading || hasRows);
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
    rows,
    loading,
    enriching,
    enrichmentFailed,
    loadFailure,
    usedStaticFallback,
    retryingRunId,
    retryFailedRunId,
    retrySucceededRunId,
    searchQuery,
    setSearchQuery,
    integrityFilter,
    setIntegrityFilter,
    page,
    cursor,
    hasMore,
    lastRefreshedAt,
    onPickReviewForFiltering,
    loadRows,
    retryRow,
    goToNextPage,
    goToPreviousPage,
    hasRows,
    isInitialLoad,
    isPageRefresh,
    filteredRows,
    continueLastViewedRow,
    filtersActive,
    showFilterNoMatch,
    showEmptyState,
    showPagination,
    showListChrome,
    showcaseSampleAvailable,
    workspaceScopeTeaching,
    freshnessLabel,
    signedRecordsFilterChecklistSteps,
    signedRecordsFilterChecklistEmphasizedStepId,
    cursorHistoryLength: cursorHistory.length,
    nextCursor,
    clearFilters,
  };
}
