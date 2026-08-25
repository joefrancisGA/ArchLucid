"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { recordSearchRecentQuery, readSearchRecentQueries, clearSearchRecentQueries } from "@/lib/search-recent-queries";
import type { RetrievalHit } from "./retrieval-hit";
import { SearchPageView } from "./SearchPageView";
import type { SearchPageViewModel } from "./search-page-view-model";

type SearchPageClientProps = {
  readonly buyerShell: boolean;
  readonly isDemo: boolean;
};

export function SearchPageClient(props: SearchPageClientProps) {
  const buyerShell = props.buyerShell;
  const isDemo = props.isDemo;
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get("runId")?.trim() ?? "";
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [runId, setRunId] = useState(initialRunId);
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [recentQueries, setRecentQueries] = useState<readonly string[]>(() => readSearchRecentQueries());

  useEffect(() => {
    const nextRunId = searchParams.get("runId")?.trim() ?? "";
    const nextQuery = searchParams.get("q")?.trim() ?? "";

    setRunId(nextRunId);

    if (nextQuery.length > 0) {
      setQuery(nextQuery);
    }
  }, [searchParams]);

  const onSearch = useCallback(async (overrideQuery?: string) => {
    const q = overrideQuery?.trim() ?? query.trim();

    if (!q) {
      return;
    }

    if (overrideQuery !== undefined) {
      setQuery(overrideQuery.trim());
    }

    setLoading(true);
    setFailure(null);

    try {
      const params = new URLSearchParams();
      params.set("q", q);

      if (runId.trim()) {
        params.set("runId", runId.trim());
      }

      const data = await apiGet<RetrievalHit[]>(`/v1/retrieval/search?${params.toString()}`);
      setResults(data);
      setHasSearched(true);
      setRecentQueries(recordSearchRecentQuery(q));
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, runId]);

  const model: SearchPageViewModel = {
    buyerShell,
    failure,
    hasSearched,
    isDemo,
    loading,
    onSearch,
    query,
    recentQueries,
    onClearRecentQueries: () => {
      clearSearchRecentQueries();
      setRecentQueries([]);
    },
    results,
    runId,
    setQuery,
    setRunId,
  };

  return <SearchPageView model={model} />;
}
