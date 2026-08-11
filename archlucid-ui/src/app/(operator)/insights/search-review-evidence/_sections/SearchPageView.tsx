"use client";

import { cn } from "@/lib/utils";
import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/FindingsQueueSearchEvidenceVocabularyRail";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { RunIdPicker } from "@/components/RunIdPicker";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEARCH_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

import type { SearchPageViewModel } from "./search-page-view-model";
import {
  SEARCH_EXAMPLE_QUERIES_LINE,
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_QUERY_FIELD_LABEL,
  SEARCH_QUERY_PLACEHOLDER,
  SEARCH_REVIEW_FILTER_LABEL,
  SEARCH_REVIEW_FILTER_PLACEHOLDER,
} from "./search-page-copy";
import { SearchRetrievalHitCard } from "./SearchRetrievalHitCard";
import { SearchReviewEvidenceCiteStrip } from "./SearchReviewEvidenceCiteStrip";

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

  if (isDemo) {
    return (
      <div className="max-w-4xl">
        <OperatorPageHeader
          title={pageTitle}
          helpKey="semantic-search"
          subtitle={SEARCH_PAGE_SUBTITLE}
          navHref={SEARCH_REVIEW_EVIDENCE_PATH}
          actions={<PageContextualHelpButton />}
        />
        <AskSearchEvidenceVocabularyRail currentSurfaceId="search" />
        <AuditEvidenceTrailVocabularyRail currentSurfaceId="search-evidence" />
        <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="search-evidence" />
        <DemoWorkspaceCapabilityUnavailablePanel
          layout="embedded"
          capability={SEARCH_PAGE_TITLE}
          description="In a connected tenant, architects search findings, decisions, and signed review records across the workspace evidence index."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <OperatorPageHeader
        title={pageTitle}
        helpKey="semantic-search"
        subtitle={SEARCH_PAGE_SUBTITLE}
        navHref={SEARCH_REVIEW_EVIDENCE_PATH}
        actions={<PageContextualHelpButton />}
      />
      <AskSearchEvidenceVocabularyRail currentSurfaceId="search" />
      <AuditEvidenceTrailVocabularyRail currentSurfaceId="search-evidence" />
      <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="search-evidence" />
      {scopedRunId.length > 0 ? <SearchReviewEvidenceCiteStrip runId={scopedRunId} /> : null}

      <Card className="mb-6 max-w-xl border-neutral-200 dark:border-neutral-700">
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
            onClick={() => void onSearch()}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching…" : "Search"}
          </Button>

          <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SEARCH_EXAMPLE_QUERIES_LINE}</p>
        </CardContent>
      </Card>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {hasSearched && failure === null && results.length === 0 ? (
        <EnterpriseCompactEmptyState
          {...SEARCH_EMPTY_COMPACT}
          actions={searchEmptyStateActions(scopedRunId)}
        />
      ) : null}

      <div className="grid gap-3">
        {results.map((hit) => (
          <SearchRetrievalHitCard
            key={hit.chunkId}
            hit={hit}
            scopedRunId={scopedRunId.length > 0 ? scopedRunId : undefined}
          />
        ))}
      </div>
    </div>
  );
}
