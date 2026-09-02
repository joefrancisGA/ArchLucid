"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  findReviewDetailSectionSearchMatches,
  type ReviewDetailSectionSearchMatch,
} from "@/lib/review-detail-header-section-search";
import {
  searchFindPageHelpEntries,
  searchFindPageIndex,
  type FindPageSearchEntry,
} from "@/lib/find-page-search-index";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { GlobalSearchResponse } from "@/types/global-search";

export type RouteLocalSearchMode = "reviews-hub" | "findings-queue" | "review-detail" | null;

export function useGlobalSearchResults(query: string, routeLocalSearchMode: RouteLocalSearchMode) {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [reviewDetailSectionMatches, setReviewDetailSectionMatches] = useState<
    readonly ReviewDetailSectionSearchMatch[]
  >([]);

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      setResults(null);
      setSearchError(false);
      return;
    }

    setLoading(true);
    setSearchError(false);

    try {
      const opts = mergeRegistrationScopeForProxy({ cache: "no-store", headers: { Accept: "application/json" } });
      const res = await fetch(`/api/proxy/v1/search?q=${encodeURIComponent(trimmed)}&take=6`, opts);

      if (!res.ok) {
        setResults(null);
        setSearchError(true);
        return;
      }

      const body = (await res.json()) as GlobalSearchResponse;
      setResults(body);
    } catch {
      setResults(null);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeLocalSearchMode !== null) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchResults(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [fetchResults, query, routeLocalSearchMode]);

  useEffect(() => {
    if (routeLocalSearchMode !== "review-detail") {
      setReviewDetailSectionMatches([]);
      return;
    }

    setReviewDetailSectionMatches(findReviewDetailSectionSearchMatches(query));
  }, [query, routeLocalSearchMode]);

  const findPageMatches = useMemo(() => searchFindPageIndex(query, { limit: 6 }), [query]);
  const helpHits = useMemo(() => searchFindPageHelpEntries(query, { limit: 4 }), [query]);
  const trimmedQuery = query.trim();

  const hasResults =
    routeLocalSearchMode === null &&
    (findPageMatches.length > 0 ||
      (results?.runs?.length ?? 0) > 0 ||
      (results?.findings?.length ?? 0) > 0 ||
      (results?.policyPacks?.length ?? 0) > 0 ||
      helpHits.length > 0);

  return {
    loading,
    searchError,
    results,
    reviewDetailSectionMatches,
    fetchResults,
    findPageMatches: findPageMatches as readonly FindPageSearchEntry[],
    helpHits,
    trimmedQuery,
    hasResults,
  };
}
