"use client";

import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { SEARCH_EMPTY } from "@/lib/search-empty-preset";

type RetrievalHit = {
  chunkId: string;
  documentId: string;
  sourceType: string;
  sourceId: string;
  title: string;
  text: string;
  score: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState("");
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  async function onSearch() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setFailure(null);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      if (runId.trim()) params.set("runId", runId.trim());
      const data = await apiGet<RetrievalHit[]>(`/v1/retrieval/search?${params.toString()}`);
      setResults(data);
      setHasSearched(true);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl">
      <OperatorPageHeader
        title="Semantic Search"
        helpKey="semantic-search"
        subtitle="Scoped to your workspace. Uses the same embedding + index as Ask ArchLucid (in-memory + fake vectors by default)."
      />

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
              placeholder="Optional Run ID filter"
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
    </main>
  );
}
