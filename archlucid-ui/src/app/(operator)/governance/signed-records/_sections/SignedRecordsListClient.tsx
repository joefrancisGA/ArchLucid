"use client";

import { useCallback, useEffect, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import { SignedRecordsListTableDeferred } from "./signed-records-list-deferred-chunks";
import {
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_PAGE_SUBTITLE,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
} from "./signed-records-list-copy";
import { SignedRecordsListPagination } from "./SignedRecordsListPagination";
import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

export default function SignedRecordsListClient() {
  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState("");
  const [cursorHistory, setCursorHistory] = useState<readonly string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadRows = useCallback(async (request: { readonly page: number; readonly cursor: string }) => {
    setLoading(true);
    setLoadError(null);

    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, request.page, SIGNED_RECORDS_LIST_PAGE_SIZE, {
        cursor: request.cursor,
        scopeHeaders,
      });
      const coerced = coerceRunSummaryPaged(raw, { page: request.page });

      if (!coerced.ok) {
        setRows([]);
        setHasMore(false);
        setNextCursor(null);
        setLoadError(coerced.message);

        return;
      }

      let runs = coerced.value.items;
      const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

      if (runs.length === 0 && staticFallback !== null) {
        runs = staticFallback.items;
      }

      const baseRows = buildSignedRecordsListRowsFromRuns(runs);
      const enrichedRows = await enrichSignedRecordsListRows(baseRows);

      setRows(enrichedRows);
      setHasMore(coerced.value.hasMore);
      setNextCursor(coerced.value.nextCursor ?? null);
    } catch (error: unknown) {
      setRows([]);
      setHasMore(false);
      setNextCursor(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load signed review records.");
    } finally {
      setLoading(false);
    }
  }, []);

  const retryRow = useCallback(async (runId: string) => {
    const existingRow = rows.find((row) => row.runId === runId);

    if (existingRow === undefined) {
      return;
    }

    setRetryingRunId(runId);

    try {
      const [enrichedRow] = await enrichSignedRecordsListRows([existingRow]);

      setRows((currentRows) => currentRows.map((row) => (row.runId === runId ? enrichedRow : row)));
    } finally {
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
  }, [cursor, nextCursor]);

  const goToPreviousPage = useCallback(() => {
    if (cursorHistory.length === 0) {
      return;
    }

    const previousCursor = cursorHistory[cursorHistory.length - 1];

    setCursorHistory((history) => history.slice(0, -1));
    setCursor(previousCursor);
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }, [cursorHistory]);

  const hasRows = rows.length > 0;
  const showPagination = !loading && loadError === null && (hasRows || page > 1 || hasMore);

  return (
    <div className="w-full max-w-[1440px]">
      <OperatorPageHeader
        navHref={SIGNED_RECORDS_LIST_PATH}
        title={SIGNED_RECORDS_LIST_PAGE_TITLE}
        subtitle={SIGNED_RECORDS_LIST_PAGE_SUBTITLE}
        titleTestId="signed-records-list-page-title"
        actions={<PageContextualHelpButton />}
      />
      <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="signed-records" />
      {loadError !== null ? (
        <OperatorSectionLoadFailure
          className="mb-4"
          message={loadError}
          retrying={loading}
          testId="signed-records-list-load-failure"
          onRetry={() => void loadRows({ page, cursor })}
        />
      ) : null}

      {!loading && !hasRows && loadError === null ? (
        <EnterpriseCompactEmptyState
          title={SIGNED_RECORDS_LIST_EMPTY_TITLE}
          description={SIGNED_RECORDS_LIST_EMPTY_BODY}
          actions={[
            { label: SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL, href: "/architecture/reviews/new", variant: "primary" },
            {
              label: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
              href: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
              variant: "outline",
            },
          ]}
        />
      ) : null}

      {loading ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>Loading signed review records…</p>
      ) : null}

      {!loading && hasRows ? (
        <SignedRecordsListTableDeferred
          rows={rows}
          retryingRunId={retryingRunId}
          onRetryRow={(runId) => {
            void retryRow(runId);
          }}
        />
      ) : null}

      {showPagination ? (
        <SignedRecordsListPagination
          page={page}
          shownCount={rows.length}
          hasMore={hasMore}
          canGoPrevious={cursorHistory.length > 0}
          canGoNext={hasMore && nextCursor !== null && nextCursor.length > 0}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      ) : null}
    </div>
  );
}
