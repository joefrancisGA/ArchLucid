"use client";

import { useCallback, useState } from "react";

import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

import type { RetrievalHit } from "./retrieval-hit";

export type UseSearchPageModel = {
  buyerShell: boolean;
  failure: ApiLoadFailureState | null;
  hasSearched: boolean;
  isDemo: boolean;
  loading: boolean;
  onSearch: () => Promise<void>;
  query: string;
  results: RetrievalHit[];
  runId: string;
  setQuery: (next: string) => void;
  setRunId: (next: string) => void;
};

export function useSearchPage(): UseSearchPageModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
  const buyerShell = isBuyerPolishedOperatorShellEnv();

  const [query, setQuery] = useState("");
  const [runId, setRunId] = useState("");
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const onSearch = useCallback(async () => {
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
  }, [query, runId]);

  return {
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
}
