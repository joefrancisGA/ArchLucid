"use client";

import Link from "next/link";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { GovernanceSealedRecordsListBreadcrumb } from "@/components/governance/GovernanceSealedRecordsListBreadcrumb";
import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { cn } from "@/lib/utils";

import { formatSignedRecordsListRecordCount } from "./signed-records-list-copy";
import {
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
import { SignedRecordsListToolbar } from "./SignedRecordsListToolbar";
import { SignedRecordsListTableDeferred } from "./signed-records-list-deferred-chunks";
import { SignedRecordsListEmptyStates } from "./SignedRecordsListEmptyStates";
import { useSignedRecordsListClient } from "./use-signed-records-list-client";

export default function SignedRecordsListClient() {
  const {
    scopedRunId,
    scopedRunFilterActive,
    rows,
    loading,
    enriching,
    loadFailure,
    usedStaticFallback,
    retryingRunId,
    retryFailedRunId,
    retrySucceededRunId,
    searchQuery,
    setSearchQuery,
    integrityFilter,
    dateRangePreset,
    fromUtc,
    toUtc,
    onIntegrityFilterChange,
    onCustomFromUtcChange,
    onCustomToUtcChange,
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
    showFilterNoMatch,
    showEmptyState,
    showPagination,
    showListChrome,
    showcaseSampleAvailable,
    workspaceScopeTeaching,
    freshnessLabel,
    signedRecordsFilterChecklistSteps,
    signedRecordsFilterChecklistEmphasizedStepId,
    cursorHistoryLength,
    nextCursor,
    clearFilters,
  } = useSignedRecordsListClient();

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

      <SignedRecordsListEmptyStates
        showEmptyState={showEmptyState}
        showFilterNoMatch={showFilterNoMatch}
        workspaceScopeTeaching={workspaceScopeTeaching}
        showcaseSampleAvailable={showcaseSampleAvailable}
        onClearFilters={clearFilters}
      />

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
          dateRangePreset={dateRangePreset}
          fromUtc={fromUtc}
          toUtc={toUtc}
          disabled={loading}
          onSearchQueryChange={setSearchQuery}
          onIntegrityFilterChange={onIntegrityFilterChange}
          onCustomFromUtcChange={onCustomFromUtcChange}
          onCustomToUtcChange={onCustomToUtcChange}
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
          canGoPrevious={cursorHistoryLength > 0}
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
