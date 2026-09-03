"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { apiGet } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  parseSearchReviewEvidenceQueryFromSearch,
  searchReviewEvidenceQueryHrefFromSearch,
} from "@/lib/insights/search-review-evidence-query-url";
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
  const pathname = usePathname() ?? SEARCH_REVIEW_EVIDENCE_PATH;
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const urlQuery = parseSearchReviewEvidenceQueryFromSearch(searchParams.get("q"));

  const [query, setQueryState] = useState(urlQuery);
  const [results, setResults] = useState<RetrievalHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [recentQueries, setRecentQueries] = useState<readonly string[]>(() => readSearchRecentQueries());
  const lastAutoSearchedQuery = useRef<string | null>(null);

  useEffect(() => {
    setQueryState(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = searchReviewEvidenceQueryHrefFromSearch(searchParams.toString(), query, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, query, router, searchParams]);

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
      setQueryState(overrideQuery.trim());
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
      lastAutoSearchedQuery.current = q;
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, scopedRunId]);

  useEffect(() => {
    if (scopedRunId.length === 0 || urlQuery.trim().length === 0) {
      return;
    }

    if (lastAutoSearchedQuery.current === urlQuery.trim()) {
      return;
    }

    void onSearch(urlQuery);
  }, [onSearch, scopedRunId, urlQuery]);

  const setQuery = useCallback((next: string): void => {
    setQueryState(next);
  }, []);

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
