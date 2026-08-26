"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceSealedRecordsListBreadcrumb } from "@/components/governance/GovernanceSealedRecordsListBreadcrumb";
import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { listRunsByProjectPaged } from "@/lib/api";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
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
import { cn } from "@/lib/utils";

import { filterSignedRecordsListRows } from "./signed-records-list-client-filter";
import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import { SignedRecordsListTableDeferred } from "./signed-records-list-deferred-chunks";
import {
  formatSignedRecordsListRecordCount,
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_FILTER_CLEAR_ACTION,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_BODY,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_TITLE,
  SIGNED_RECORDS_LIST_LAST_REFRESHED_PREFIX,
  SIGNED_RECORDS_LIST_LIST_LEAD,
  SIGNED_RECORDS_LIST_LOADING_STATUS,
  SIGNED_RECORDS_LIST_PAGE_SUBTITLE,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
  SIGNED_RECORDS_LIST_RETRY_FAILED_STATUS,
  SIGNED_RECORDS_LIST_RETRY_SUCCEEDED_STATUS,
} from "./signed-records-list-copy";
import { SignedRecordsContinueLastViewedRow } from "./SignedRecordsContinueLastViewedRow";
import { SignedRecordsListPickReviewBeforeFilteringStrip } from "./SignedRecordsListPickReviewBeforeFilteringStrip";
import { SignedRecordsListNextReviewFooterClient } from "./SignedRecordsListNextReviewFooterClient";
import { SignedRecordsListPagination } from "./SignedRecordsListPagination";
import { SignedRecordsListTableSkeleton } from "./SignedRecordsListTableSkeleton";
import {
  SignedRecordsListToolbar,
  type SignedRecordsListIntegrityFilter,
} from "./SignedRecordsListToolbar";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

export default function SignedRecordsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
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
    setLoading(true);
    setLoadFailure(null);
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

      const enrichedRows = await enrichSignedRecordsListRows(baseRows);

      setRows(enrichedRows);
    } catch (error: unknown) {
      setRows([]);
      setHasMore(false);
      setNextCursor(null);
      setLoadFailure(toApiLoadFailure(error));
    } finally {
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

      setRows((currentRows) => currentRows.map((row) => (row.runId === runId ? enrichedRow : row)));

      if (enrichedRow.recordLookupFailure !== null || enrichedRow.signedRecordHref === null) {
        setRetryFailedRunId(runId);
      } else {
        setRetrySucceededRunId(runId);
      }
    } catch {
      setRetryFailedRunId(runId);
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
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2" data-testid="signed-records-list-header-actions">
      <PageContextualHelpButton />
      <RefreshButton
        variant="outline"
        busy={loading}
        onClick={() => {
          void loadRows({ page, cursor });
        }}
      />
    </div>
  );

  return (
    <OperatorPageContainer variant="dashboard">
      <OperatorPageHeader
        navHref={SIGNED_RECORDS_LIST_PATH}
        title={SIGNED_RECORDS_LIST_PAGE_TITLE}
        subtitle={SIGNED_RECORDS_LIST_PAGE_SUBTITLE}
        titleTestId="signed-records-list-page-title"
        breadcrumb={<GovernanceSealedRecordsListBreadcrumb />}
        actions={headerActions}
      />
      <ArchitectureObjectMapStrip focus="sealed" />

      {usedStaticFallback && isOperatorExperienceFullShellEnv() ? (
        <div className="mb-4 max-w-5xl">
          <OperatorDemoStaticBanner emphasizeSampleData />
        </div>
      ) : null}

      {hasRows ? <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="signed-records" /> : null}

      {continueLastViewedRow !== null && hasRows ? (
        <SignedRecordsContinueLastViewedRow row={continueLastViewedRow} scopedRunId={scopedRunId} />
      ) : null}

      {loadFailure !== null ? (
        <div className="mb-4 space-y-3" data-testid="signed-records-list-load-failure">
          <OperatorApiProblem failure={loadFailure} />
        </div>
      ) : null}

      {scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="signed-records-list-run-scope-banner"
        >
          {"Showing signed records for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={SIGNED_RECORDS_LIST_PATH}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : (
        <SignedRecordsListPickReviewBeforeFilteringStrip
          selectedReviewId=""
          onSelectReview={onPickReviewForFiltering}
        />
      )}

      {scopedRunFilterActive ? (
        <IntegrationConnectChecklist
          title="Filter checklist"
          steps={signedRecordsFilterChecklistSteps}
          emphasizedStepId={signedRecordsFilterChecklistEmphasizedStepId}
          testIdPrefix="signed-records-filter"
        />
      ) : null}

      {showEmptyState ? (
        workspaceScopeTeaching !== null ? (
          <WorkspaceScopeEmptyTeaching
            title={workspaceScopeTeaching.title}
            body={workspaceScopeTeaching.body}
            ctaLabel={workspaceScopeTeaching.ctaLabel}
          />
        ) : (
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
              ...(showcaseSampleAvailable
                ? [{ label: SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA, href: getShowcaseManifestHref(), variant: "outline" as const }]
                : []),
            ]}
          />
        )
      ) : null}

      {scopedRunFilterActive && showListChrome ? (
        <div className="mb-4 space-y-2" data-testid="signed-records-list-chrome">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SIGNED_RECORDS_LIST_LIST_LEAD}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="signed-records-list-record-count">
              {formatSignedRecordsListRecordCount(rows.length, { page, hasMore })}
            </span>
            <OperatorPageFreshnessMetadata
              testId="signed-records-list-last-refreshed"
              lastRefreshedAt={loading ? null : lastRefreshedAt}
            >
              {freshnessLabel}
            </OperatorPageFreshnessMetadata>
          </div>
        </div>
      ) : null}

      {scopedRunFilterActive && showListChrome && hasRows ? (
        <SignedRecordsListToolbar
          searchQuery={searchQuery}
          integrityFilter={integrityFilter}
          disabled={loading}
          onSearchQueryChange={setSearchQuery}
          onIntegrityFilterChange={setIntegrityFilter}
        />
      ) : null}

      {isInitialLoad ? (
        <p
          className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}
          role="status"
          aria-live="polite"
          data-testid="signed-records-list-loading-status"
        >
          {SIGNED_RECORDS_LIST_LOADING_STATUS}
        </p>
      ) : null}

      {isPageRefresh ? <SignedRecordsListTableSkeleton rowCount={Math.max(rows.length, 3)} /> : null}

      {showFilterNoMatch ? (
        <EnterpriseCompactEmptyState
          title={SIGNED_RECORDS_LIST_FILTER_NO_MATCH_TITLE}
          description={SIGNED_RECORDS_LIST_FILTER_NO_MATCH_BODY}
          footer={
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="signed-records-list-clear-filters"
              onClick={() => {
                setSearchQuery("");
                setIntegrityFilter("all");
              }}
            >
              {SIGNED_RECORDS_LIST_FILTER_CLEAR_ACTION}
            </Button>
          }
        />
      ) : null}

      {scopedRunFilterActive && !loading && hasRows && !showFilterNoMatch ? (
        <SignedRecordsListTableDeferred
          rows={filteredRows}
          enriching={enriching}
          retryingRunId={retryingRunId}
          retryFailedRunId={retryFailedRunId}
          retrySucceededRunId={retrySucceededRunId}
          onRetryRow={(runId) => {
            void retryRow(runId);
          }}
        />
      ) : null}

      {retrySucceededRunId !== null ? (
        <p
          className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          aria-live="polite"
          data-testid={`signed-records-list-retry-succeeded-${retrySucceededRunId}`}
        >
          {SIGNED_RECORDS_LIST_RETRY_SUCCEEDED_STATUS}
        </p>
      ) : null}

      {retryFailedRunId !== null ? (
        <p
          className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          aria-live="polite"
          data-testid={`signed-records-list-retry-failed-${retryFailedRunId}`}
        >
          {SIGNED_RECORDS_LIST_RETRY_FAILED_STATUS}
        </p>
      ) : null}

      {scopedRunFilterActive && showPagination ? (
        <SignedRecordsListPagination
          page={page}
          shownCount={rows.length}
          hasMore={hasMore}
          canGoPrevious={cursorHistory.length > 0}
          canGoNext={hasMore && nextCursor !== null && nextCursor.length > 0}
          disabled={loading}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      ) : null}

      {scopedRunFilterActive ? <SignedRecordsListNextReviewFooterClient runId={scopedRunId} /> : null}
    </OperatorPageContainer>
  );
}
