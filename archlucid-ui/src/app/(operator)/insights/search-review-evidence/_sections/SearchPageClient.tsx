"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [recentQueries, setRecentQueries] = useState<readonly string[]>(() => readSearchRecentQueries());

  useEffect(() => {
    const nextQuery = searchParams.get("q")?.trim() ?? "";

    if (nextQuery.length > 0) {
      setQuery(nextQuery);
    }
  }, [searchParams]);

  const setRunId = useCallback(
    (next: string) => {
      const trimmed = next.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${SEARCH_REVIEW_EVIDENCE_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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

      if (scopedRunId.length > 0) {
        params.set("runId", scopedRunId);
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
  }, [query, scopedRunId]);

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
    runId: scopedRunId,
    setQuery,
    setRunId,
  };

  return <SearchPageView model={model} />;
}
