"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { listRunsByProjectPaged } from "@/lib/api";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import {
  parseSignedRecordsListCursorFromSearch,
  signedRecordsListCursorHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-pagination-url";

import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

export function useSignedRecordsListFetch(options: {
  readonly enrichRows: (
    baseRows: readonly SignedRecordsListRow[],
    canApplyState: () => boolean,
  ) => Promise<void>;
  readonly resetRetryState: () => void;
  readonly onPaginationPageChange: () => void;
}) {
  const { enrichRows, resetRetryState, onPaginationPageChange } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCursor = parseSignedRecordsListCursorFromSearch(searchParams.get("cursor"));
  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [usedStaticFallback, setUsedStaticFallback] = useState(false);
  const [page, setPage] = useState(urlCursor.length > 0 ? 2 : 1);
  const [cursor, setCursor] = useState(urlCursor);
  const [cursorHistory, setCursorHistory] = useState<readonly string[]>(() =>
    urlCursor.length > 0 ? ["", urlCursor] : [""],
  );
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const loadRowsRequestVersionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    const nextCursor = parseSignedRecordsListCursorFromSearch(searchParams.get("cursor"));

    if (nextCursor === cursor) {
      return;
    }

    setCursor(nextCursor);
    setCursorHistory(nextCursor.length > 0 ? ["", nextCursor] : [""]);
    setPage(nextCursor.length > 0 ? 2 : 1);
  }, [cursor, searchParams]);

  const syncCursorToUrl = useCallback(
    (nextCursor: string) => {
      const nextHref = signedRecordsListCursorHrefFromSearch(searchParams.toString(), nextCursor);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    },
    [router, searchParams],
  );

  const loadRows = useCallback(
    async (request: { readonly page: number; readonly cursor: string }) => {
      const requestVersion = loadRowsRequestVersionRef.current + 1;
      loadRowsRequestVersionRef.current = requestVersion;
      const canApplyState = () => mountedRef.current && loadRowsRequestVersionRef.current === requestVersion;

      setLoading(true);
      setLoadFailure(null);
      setUsedStaticFallback(false);
      resetRetryState();

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

        await enrichRows(baseRows, canApplyState);
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

        setLoading(false);
      }
    },
    [enrichRows, resetRetryState],
  );

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
    syncCursorToUrl(nextCursor);
    onPaginationPageChange();
  }, [cursor, nextCursor, onPaginationPageChange, syncCursorToUrl]);

  const goToPreviousPage = useCallback(() => {
    if (cursorHistory.length === 0) {
      return;
    }

    const previousCursor = cursorHistory[cursorHistory.length - 1] ?? "";

    setCursorHistory((history) => history.slice(0, -1));
    setCursor(previousCursor);
    setPage((currentPage) => Math.max(1, currentPage - 1));
    syncCursorToUrl(previousCursor);
    onPaginationPageChange();
  }, [cursorHistory, onPaginationPageChange, syncCursorToUrl]);

  const hasRows = rows.length > 0;
  const isInitialLoad = loading && !hasRows;
  const isPageRefresh = loading && hasRows;
  const showEmptyState = !loading && !hasRows && loadFailure === null;
  const showPagination = loadFailure === null && (loading || hasRows || page > 1 || hasMore);
  const showListChrome = loadFailure === null && (loading || hasRows);

  return {
    rows,
    setRows,
    loading,
    loadFailure,
    usedStaticFallback,
    page,
    cursor,
    cursorHistoryLength: cursorHistory.length,
    hasMore,
    nextCursor,
    lastRefreshedAt,
    loadRows,
    goToNextPage,
    goToPreviousPage,
    hasRows,
    isInitialLoad,
    isPageRefresh,
    showEmptyState,
    showPagination,
    showListChrome,
    mountedRef,
  };
}

export type SignedRecordsListFetchSetRows = Dispatch<SetStateAction<readonly SignedRecordsListRow[]>>;
