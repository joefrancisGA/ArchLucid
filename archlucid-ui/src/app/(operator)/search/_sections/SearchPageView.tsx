"use client";

import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  semanticSearchPageDeploymentNoteDev,
  semanticSearchPageSubtitleOperator,
} from "@/lib/enterprise-controls-context-copy";
import { SEARCH_EMPTY } from "@/lib/search-empty-preset";

import type { SearchPageViewModel } from "./search-page-view-model";

type SearchPageViewProps = {
  model: SearchPageViewModel;
};

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

  if (isDemo) {
    // Same heading chrome as the live page so demo builds keep a recognizable route title below the shell.
    return (
      <div className="max-w-4xl">
        <OperatorPageHeader
          title={buyerShell === true ? "Search this review's evidence" : "Semantic Search"}
          helpKey="semantic-search"
          subtitle={semanticSearchPageSubtitleOperator}
        />

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">
            Semantic search not available in demo mode.
          </p>
          <p className="m-0 mt-1">Full-text search across reviews requires a live API connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <OperatorPageHeader
        title={buyerShell === true ? "Search this review's evidence" : "Semantic Search"}
        helpKey="semantic-search"
        subtitle={semanticSearchPageSubtitleOperator}
      />

      {process.env.NODE_ENV === "development" ? (
        <details className="mb-4 max-w-prose rounded-md border border-dashed border-neutral-300 bg-neutral-50/80 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900/40">
          <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
            Deployment note (development only)
          </summary>
          <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">{semanticSearchPageDeploymentNoteDev}</p>
        </details>
      ) : null}

      <Card className="mb-6 max-w-xl border-neutral-200 dark:border-neutral-700">
        <CardContent className="grid gap-3 p-4">
          <div className="space-y-2">
            <Label htmlFor="semantic-search-query">Query</Label>
            <Input
              id="semantic-search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search architecture knowledge..."
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semantic-search-run-id">Optional run ID</Label>
            <Input
              id="semantic-search-run-id"
              className="font-mono text-sm"
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              placeholder="Optional Review ID filter"
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-fit"
            onClick={() => void onSearch()}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching…" : "Search"}
          </Button>
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

      {hasSearched && failure === null && results.length === 0 ? <EmptyState {...SEARCH_EMPTY} /> : null}

      <div className="grid gap-3">
        {results.map((hit) => (
          <Card key={hit.chunkId}>
            <CardContent className="space-y-2 p-4">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">{hit.title}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{hit.sourceType}</div>
              <div className="text-sm text-neutral-800 dark:text-neutral-200">Score: {hit.score.toFixed(3)}</div>
              <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">{hit.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
