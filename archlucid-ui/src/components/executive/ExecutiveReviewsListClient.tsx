"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunSummary } from "@/types/authority";

function runHeadline(run: RunSummary): string {
  const description = (run.description ?? "").trim();

  if (description.length > 0) {
    return description;
  }

  return run.runId;
}

export type ExecutiveReviewsListClientProps = {
  readonly runs: readonly RunSummary[];
};

/** Client-side filter for finalized executive review cards. */
export function ExecutiveReviewsListClient({ runs }: ExecutiveReviewsListClientProps) {
  const [query, setQuery] = useState("");

  const filteredRuns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return runs;
    }

    return runs.filter((run) => {
      const headline = runHeadline(run).toLowerCase();
      const runId = run.runId.toLowerCase();

      return headline.includes(normalizedQuery) || runId.includes(normalizedQuery);
    });
  }, [query, runs]);

  return (
    <div className="space-y-4" data-testid="executive-reviews-list">
      <div className="max-w-md">
        <label htmlFor="executive-reviews-filter" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Filter reviews
        </label>
        <input
          id="executive-reviews-filter"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by review name or id"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </div>

      {filteredRuns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No matching reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              Try a different search term or clear the filter to see all finalized reviews.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {filteredRuns.map((run) => (
            <li key={run.runId}>
              <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-sm font-semibold text-al-text-primary">
                    {runHeadline(run)}
                  </CardTitle>
                  <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                    Created {new Date(run.createdUtc).toLocaleString()} · {run.findingCount ?? "—"} findings
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/executive/reviews/${encodeURIComponent(run.runId)}`}>Open risk review</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
