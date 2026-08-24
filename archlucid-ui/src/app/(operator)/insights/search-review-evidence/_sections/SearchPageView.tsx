"use client";

import { cn } from "@/lib/utils";
import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEARCH_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_FORM_FIELD_LABEL_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

import type { SearchPageViewModel } from "./search-page-view-model";
import {
  SEARCH_EXAMPLE_QUERY_CHIPS,
  SEARCH_LOAD_RETRY_LABEL,
  SEARCH_PAGE_TITLE,
  SEARCH_QUERY_FIELD_LABEL,
  SEARCH_QUERY_PLACEHOLDER,
  SEARCH_REVIEW_FILTER_LABEL,
  SEARCH_REVIEW_FILTER_PLACEHOLDER,
  searchReviewEvidencePageSubtitle,
} from "./search-page-copy";
import { SearchRetrievalHitCard } from "./SearchRetrievalHitCard";
import { SearchReviewEvidenceBuyerChrome } from "./SearchReviewEvidenceBuyerChrome";
import { SearchReviewEvidenceCiteStrip } from "./SearchReviewEvidenceCiteStrip";
import { SearchReviewEvidenceLoadFailurePanel } from "./SearchReviewEvidenceLoadFailurePanel";
import { SearchReviewEvidencePageHeader } from "./SearchReviewEvidencePageHeader";

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
    setQuery,
    setRunId,
  } = model;

  const pageTitle = searchPageTitle(runId);
  const scopedRunId = runId.trim();
  const pageSubtitle = searchReviewEvidencePageSubtitle(buyerShell === true);
  const showVocabularyRails = buyerShell !== true;

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

          <RunIdPicker
            preferAutoPick={false}
            committedOnly
            label={SEARCH_REVIEW_FILTER_LABEL}
            labelClassName={OPERATOR_FORM_FIELD_LABEL_CLASS}
            placeholder={SEARCH_REVIEW_FILTER_PLACEHOLDER}
            value={runId}
            onChange={setRunId}
            inputId="semantic-search-run-filter"
            useBuyerFacingRunLabels={buyerShell === true}
          />

          <details
            className={cn(
              "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              Advanced: filter by review ID
            </summary>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Paste a review ID when the review is not in the recent list. The filter above accepts the same
              value.
            </p>
            <div className="mt-3 space-y-2">
              <Label htmlFor="semantic-search-run-id-advanced">Review ID</Label>
              <Input
                id="semantic-search-run-id-advanced"
                className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="Paste review ID to narrow search"
                autoComplete="off"
              />
            </div>
          </details>

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
                  className="h-auto max-w-full whitespace-normal py-1 font-normal"
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
    </OperatorPageContainer>
  );
}
