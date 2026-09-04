"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";
import { apiGet } from "@/lib/api";
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
import type { ReviewPackageSearchScope } from "@/lib/review-detail-package-search-scope";
import { filterLivePackageSearchHits } from "@/lib/review-package-search-results";
import type { GlobalSearchResponse } from "@/types/global-search";

export type RouteLocalSearchMode = "reviews-hub" | "findings-queue" | "review-detail" | null;

export type UseGlobalSearchResultsOptions = {
  readonly packageRunId?: string | null;
  readonly searchScope?: ReviewPackageSearchScope;
};

export function useGlobalSearchResults(
  query: string,
  routeLocalSearchMode: RouteLocalSearchMode,
  options: UseGlobalSearchResultsOptions = {},
) {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [packageHits, setPackageHits] = useState<readonly RetrievalHit[]>([]);
  const [packageSearchLoading, setPackageSearchLoading] = useState(false);
  const [packageSearchError, setPackageSearchError] = useState(false);
  const [reviewDetailSectionMatches, setReviewDetailSectionMatches] = useState<
    readonly ReviewDetailSectionSearchMatch[]
  >([]);

  const packageRunId = options.packageRunId?.trim() ?? "";
  const packageScoped =
    routeLocalSearchMode === "review-detail" &&
    options.searchScope === "package" &&
    packageRunId.length > 0;
  const workspaceScoped =
    routeLocalSearchMode === null ||
    (routeLocalSearchMode === "review-detail" && options.searchScope === "workspace");

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

  const fetchPackageResults = useCallback(
    async (q: string) => {
      const trimmed = q.trim();

      if (trimmed.length < 2 || packageRunId.length === 0) {
        setPackageHits([]);
        setPackageSearchError(false);
        return;
      }

      setPackageSearchLoading(true);
      setPackageSearchError(false);

      try {
        const params = new URLSearchParams();
        params.set("q", trimmed);
        params.set("runId", packageRunId);
        const data = await apiGet<RetrievalHit[]>(`/v1/retrieval/search?${params.toString()}`);
        setPackageHits(filterLivePackageSearchHits(data, packageRunId));
      } catch {
        setPackageHits([]);
        setPackageSearchError(true);
      } finally {
        setPackageSearchLoading(false);
      }
    },
    [packageRunId],
  );

  useEffect(() => {
    if (!workspaceScoped) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchResults(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [fetchResults, query, workspaceScoped]);

  useEffect(() => {
    if (!packageScoped) {
      setPackageHits([]);
      setPackageSearchError(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchPackageResults(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [fetchPackageResults, packageScoped, query]);

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
    workspaceScoped &&
    (findPageMatches.length > 0 ||
      (results?.runs?.length ?? 0) > 0 ||
      (results?.findings?.length ?? 0) > 0 ||
      (results?.policyPacks?.length ?? 0) > 0 ||
      helpHits.length > 0);

  const hasPackageResults = packageScoped && packageHits.length > 0;

  return {
    loading,
    searchError,
    results,
    packageHits,
    packageSearchLoading,
    packageSearchError,
    reviewDetailSectionMatches,
    fetchResults,
    fetchPackageResults,
    findPageMatches: findPageMatches as readonly FindPageSearchEntry[],
    helpHits,
    trimmedQuery,
    hasResults,
    hasPackageResults,
  };
}
