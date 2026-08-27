"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEARCH_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";
import {
  resolveSearchReviewEvidenceEmphasizedStepId,
  resolveSearchReviewEvidenceSteps,
} from "@/lib/search-review-evidence-checklist";

import type { SearchPageViewModel } from "./search-page-view-model";
import {
  SEARCH_EXAMPLE_QUERY_CHIPS,
  SEARCH_LOAD_RETRY_LABEL,
  SEARCH_PAGE_TITLE,
  SEARCH_QUERY_FIELD_LABEL,
  SEARCH_QUERY_PLACEHOLDER,
  searchReviewEvidencePageSubtitle,
} from "./search-page-copy";
import { SearchRetrievalHitCard } from "./SearchRetrievalHitCard";
import { SearchReviewEvidenceBuyerChrome } from "./SearchReviewEvidenceBuyerChrome";
import { SearchReviewEvidenceCiteStrip } from "./SearchReviewEvidenceCiteStrip";
import { SearchReviewEvidenceLoadFailurePanel } from "./SearchReviewEvidenceLoadFailurePanel";
import { SearchReviewEvidencePageHeader } from "./SearchReviewEvidencePageHeader";
import { SearchPickReviewBeforeSearchStrip } from "./SearchPickReviewBeforeSearchStrip";
import { SearchNextReviewFooterClient } from "./SearchNextReviewFooterClient";

type SearchPageViewProps = {
  model: SearchPageViewModel;
};

function searchPageTitle(runId: string): string {
  return runId.trim().length > 0 ? EVIDENCE_TRAIL_SEARCH.scopedTitle : SEARCH_PAGE_TITLE;
}

function searchEmptyStateActions(scopedRunId: string) {
  const evidenceHref =
    scopedRunId.length > 0 ? evidenceGraphHref({ runId: scopedRunId }) : evidenceGraphHref();

  return SEARCH_EMPTY_COMPACT.actions?.map((action) =>
    action.label === "Evidence graph" ? { ...action, href: evidenceHref } : action,
  );
}

export function SearchPageView({ model }: SearchPageViewProps) {
  const {
    buyerShell,
    failure,
    hasSearched,
    isDemo,
    loading,
    onSearch,
    query,
    results,
    runId,
    recentQueries,
    onClearRecentQueries,
    setQuery,
    setRunId,
  } = model;

  const pageTitle = searchPageTitle(runId);
  const scopedRunId = runId.trim();
  const pageSubtitle = searchReviewEvidencePageSubtitle(buyerShell === true);
  const showVocabularyRails = buyerShell !== true;
  const searchReviewSteps = resolveSearchReviewEvidenceSteps({
    reviewPicked: scopedRunId.length > 0,
    queryConfigured: query.trim().length > 0,
    searchComplete: hasSearched && results.length > 0,
  });
  const searchReviewEmphasizedStepId = resolveSearchReviewEvidenceEmphasizedStepId({
    reviewPicked: scopedRunId.length > 0,
    queryConfigured: query.trim().length > 0,
    searchComplete: hasSearched && results.length > 0,
  });

  if (isDemo) {
    return (
      <OperatorPageContainer
        variant="workflow"
        className={OPERATOR_LAYOUT.majorSectionGap}
        data-testid="search-review-evidence-page"
      >
        <SearchReviewEvidencePageHeader title={pageTitle} subtitle={pageSubtitle} />
        <SearchReviewEvidenceBuyerChrome />
        {showVocabularyRails ? (
          <OperatorRelatedSurfacesDisclosure testId="search-related-surfaces-disclosure">
            <AskSearchEvidenceVocabularyRail currentSurfaceId="search" />
            <AuditEvidenceTrailVocabularyRail currentSurfaceId="search-evidence" />
            <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="search-evidence" />
            <PageCapabilityBoundaryStrip surfaceId="searchReviewEvidence" className="mb-0" />
          </OperatorRelatedSurfacesDisclosure>
        ) : (
          <PageCapabilityBoundaryStrip surfaceId="searchReviewEvidence" />
        )}
        <DemoWorkspaceCapabilityUnavailablePanel
          layout="embedded"
          capability={SEARCH_PAGE_TITLE}
          description="In a connected tenant, architects search findings, decisions, and Finalized review records across the workspace evidence index."
        />
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="search-review-evidence-page"
    >
      <SearchReviewEvidencePageHeader title={pageTitle} subtitle={pageSubtitle} />

      <SearchReviewEvidenceBuyerChrome />

      {showVocabularyRails ? (
        <OperatorRelatedSurfacesDisclosure testId="search-related-surfaces-disclosure">
          <AskSearchEvidenceVocabularyRail currentSurfaceId="search" />
          <AuditEvidenceTrailVocabularyRail currentSurfaceId="search-evidence" />
          <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="search-evidence" />
          <PageCapabilityBoundaryStrip surfaceId="searchReviewEvidence" className="mb-0" />
        </OperatorRelatedSurfacesDisclosure>
      ) : (
        <PageCapabilityBoundaryStrip surfaceId="searchReviewEvidence" />
      )}
      {scopedRunId.length > 0 ? <SearchReviewEvidenceCiteStrip runId={scopedRunId} /> : null}

      {scopedRunId.length === 0 ? (
        <SearchPickReviewBeforeSearchStrip selectedReviewId={runId} onSelectReview={setRunId} />
      ) : (
        <>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="search-review-evidence-run-scope-banner"
          >
            {"Search evidence for review "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={SEARCH_REVIEW_EVIDENCE_PATH}>
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
          <IntegrationConnectChecklist
            title="Search checklist"
            steps={searchReviewSteps}
            emphasizedStepId={searchReviewEmphasizedStepId}
            testIdPrefix="search-review-evidence"
          />
        </>
      )}

      {scopedRunId.length > 0 ? (
        <>
      <Card className="max-w-xl border-neutral-200 dark:border-neutral-700" data-testid="search-review-evidence-form">
        <CardContent className="grid gap-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="semantic-search-query">{SEARCH_QUERY_FIELD_LABEL}</Label>
            <Input
              id="semantic-search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_QUERY_PLACEHOLDER}
              autoComplete="off"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-fit"
            data-testid="search-review-evidence-submit"
            onClick={() => void onSearch()}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching…" : "Search"}
          </Button>

          <div className="space-y-2" data-testid="search-example-query-chips">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Example queries</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Example search queries">
              {SEARCH_EXAMPLE_QUERY_CHIPS.map((chip) => (
                <Button
                  key={chip.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto max-w-full whitespace-normal py-1"
                  data-testid={`search-example-query-chip-${chip.id}`}
                  disabled={loading}
                  onClick={() => {
                    setQuery(chip.query);
                    void onSearch(chip.query);
                  }}
                >
                  {chip.label}
                </Button>
              ))}
            </div>
          </div>

          {recentQueries.length > 0 ? (
            <div className="space-y-2" data-testid="search-recent-query-chips">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Recent searches</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto px-2 py-1"
                  data-testid="search-recent-queries-clear"
                  onClick={onClearRecentQueries}
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Recent search queries">
                {recentQueries.map((recentQuery) => (
                  <Button
                    key={recentQuery}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto max-w-full whitespace-normal py-1"
                    data-testid={`search-recent-query-chip-${recentQuery}`}
                    disabled={loading}
                    onClick={() => {
                      setQuery(recentQuery);
                      void onSearch(recentQuery);
                    }}
                  >
                    {recentQuery}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {failure !== null ? (
        <SearchReviewEvidenceLoadFailurePanel
          failure={failure}
          retryLabel={SEARCH_LOAD_RETRY_LABEL}
          testId="search-review-evidence-load-failure"
          retryTestId="search-review-evidence-load-retry"
          retryDisabled={loading || !query.trim()}
          onRetry={() => {
            void onSearch();
          }}
        />
      ) : null}

      {hasSearched && failure === null && results.length === 0 ? (
        <EnterpriseCompactEmptyState
          {...SEARCH_EMPTY_COMPACT}
          actions={searchEmptyStateActions(scopedRunId)}
        />
      ) : null}

      <div className="grid gap-3" data-testid="search-review-evidence-results">
        {results.map((hit) => (
          <SearchRetrievalHitCard
            key={hit.chunkId}
            hit={hit}
            scopedRunId={scopedRunId.length > 0 ? scopedRunId : undefined}
          />
        ))}
      </div>

      {scopedRunId.length > 0 ? <SearchNextReviewFooterClient runId={scopedRunId} query={query} /> : null}
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
