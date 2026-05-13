"use client";

import { useCallback, useState } from "react";

import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import type { SearchPageViewModel } from "./search-page-view-model";
import type { RetrievalHit } from "./retrieval-hit";
import { SearchPageView } from "./SearchPageView";

type SearchPageClientProps = {
  readonly buyerShell: boolean;
  readonly isDemo: boolean;
};

export function SearchPageClient(props: SearchPageClientProps) {
  const buyerShell = props.buyerShell;
  const isDemo = props.isDemo;

  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState("");
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const onSearch = useCallback(async () => {
    const q = query.trim();

    if (!q) {
      return;
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
    results,
    runId,
    setQuery,
    setRunId,
  };

  return <SearchPageView model={model} />;
}
