"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  auditTrailCursorHrefFromSearch,
  parseAuditTrailCursorFromSearch,
} from "@/lib/governance/audit-trail-cursor-url";

import type { AuditFilterFields } from "./audit-page-helpers";
import { resolveAuditScopedRunId, shouldDeferAuditAutoSearch } from "./audit-page-helpers";
import { resolveAuditSearchPageForUi, shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";
import {
  auditFiltersToQueryRecord,
  fetchAuditEventsSearch,
} from "./audit-events-query-fetch";

type UseAuditPageSearchQueryOptions = {
  readonly runId: string;
  readonly currentFilters: () => AuditFilterFields;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
  readonly pathname: string;
  readonly searchParams: ReturnType<typeof useSearchParams>;
  readonly router: ReturnType<typeof useRouter>;
};

export function useAuditPageSearchQuery(options: UseAuditPageSearchQueryOptions) {
  const { runId, currentFilters, setFailure, pathname, searchParams, router } = options;

  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const workspaceRun = useWorkspaceActiveRun();
  const urlCursor = parseAuditTrailCursorFromSearch(searchParams.get("cursor"));
  const pendingUrlCursorRef = useRef(urlCursor);

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const initialAutoSearchPrimedRef = useRef(false);
  const lastAutoSearchUrlRunIdRef = useRef<string | null>(null);

  const syncCursorToUrl = useCallback(
    (nextCursor: string) => {
      const nextHref = auditTrailCursorHrefFromSearch(searchParams.toString(), nextCursor, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const clearCursorFromUrl = useCallback(() => {
    syncCursorToUrl("");
  }, [syncCursorToUrl]);

  const executeSearch = useCallback(
    async (filters: AuditFilterFields, loadMoreCursor?: string | null) => {
      setFailure(null);

      return queryClient.fetchQuery({
        queryKey: operatorQueryKeys.auditEventsSearch(
          scope,
          auditFiltersToQueryRecord(filters),
          loadMoreCursor ?? null,
        ),
        queryFn: () => fetchAuditEventsSearch(filters, loadMoreCursor),
        staleTime: 0,
        gcTime: OPERATOR_QUERY_GC_MS,
      });
    },
    [queryClient, scope, setFailure],
  );

  const applySearchPageToState = useCallback(
    (page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields, options?: { readonly append?: boolean }) => {
      const slice = resolveAuditSearchPageForUi(page, filters);

      if (options?.append === true) {
        setEvents((prev) => {
          const seen = new Set(prev.map((e) => e.eventId));
          const merged = [...prev];

          for (const ev of slice.events) {
            if (!seen.has(ev.eventId)) {
              merged.push(ev);
            }
          }

          return merged;
        });
      } else {
        setEvents(slice.events);
        clearCursorFromUrl();
      }

      setHasMoreResults(slice.hasMoreResults);
      setAuditNextCursor(slice.auditNextCursor);
      setLastRefreshedAt(new Date());
    },
    [clearCursorFromUrl],
  );

  const applyDemoAuditFallback = useCallback(() => {
    setEvents(getDemoSampleAuditTrailEvents());
    setHasMoreResults(false);
    setAuditNextCursor(null);
    setFailure(null);
    setLastRefreshedAt(new Date());
  }, [setFailure]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    pendingUrlCursorRef.current = "";

    try {
      const filters = currentFilters();
      const page = await executeSearch(filters);

      applySearchPageToState(page, filters);
    } catch (e) {
      const emptyFilters = currentFilters();

      if (shouldInjectAuditDemoOnSearchError(emptyFilters)) {
        applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applyDemoAuditFallback, applySearchPageToState, currentFilters, executeSearch, setFailure]);

  useEffect(() => {
    const urlRunIdParam = searchParams.get("runId")?.trim() ?? "";
    const scopedRunId = resolveAuditScopedRunId({
      urlRunId: urlRunIdParam,
      pathname: pathname ?? GOVERNANCE_AUDIT_PATH,
      search: searchParams.toString(),
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });

    if (shouldDeferAuditAutoSearch(runId, scopedRunId)) {
      return;
    }

    const shouldAutoSearch =
      !initialAutoSearchPrimedRef.current || urlRunIdParam !== lastAutoSearchUrlRunIdRef.current;

    if (!shouldAutoSearch) {
      return;
    }

    initialAutoSearchPrimedRef.current = true;
    lastAutoSearchUrlRunIdRef.current = urlRunIdParam;
    void runSearch();
  }, [pathname, runId, runSearch, searchParams, workspaceRun?.activeRunId]);

  const loadMore = useCallback(async () => {
    if (events.length === 0) {
      return;
    }

    if (!auditNextCursor) {
      return;
    }

    setLoadingMore(true);
    setFailure(null);

    const consumedCursor = auditNextCursor;

    try {
      const page = await executeSearch(currentFilters(), consumedCursor);

      setHasMoreResults(page.hasMore);
      setAuditNextCursor(page.nextCursor);
      syncCursorToUrl(page.nextCursor ?? "");

      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.eventId));
        const merged = [...prev];

        for (const ev of page.items) {
          if (!seen.has(ev.eventId)) {
            merged.push(ev);
          }
        }

        return merged;
      });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoadingMore(false);
    }
  }, [auditNextCursor, currentFilters, events.length, executeSearch, setFailure, syncCursorToUrl]);

  const restoreUrlCursorPage = useCallback(async () => {
    const cursor = pendingUrlCursorRef.current.trim();

    if (cursor.length === 0) {
      return;
    }

    setLoadingMore(true);
    setFailure(null);

    try {
      const page = await executeSearch(currentFilters(), cursor);
      applySearchPageToState(page, currentFilters(), { append: true });
      pendingUrlCursorRef.current = "";
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoadingMore(false);
    }
  }, [applySearchPageToState, currentFilters, executeSearch, setFailure]);

  useEffect(() => {
    pendingUrlCursorRef.current = parseAuditTrailCursorFromSearch(searchParams.get("cursor"));
  }, [searchParams]);

  useEffect(() => {
    if (searching || events.length === 0) {
      return;
    }

    if (pendingUrlCursorRef.current.trim().length === 0) {
      return;
    }

    void restoreUrlCursorPage();
  }, [events.length, restoreUrlCursorPage, searching]);

  return {
    events,
    hasMoreResults,
    searching,
    loadingMore,
    lastRefreshedAt,
    setSearching,
    executeSearch,
    applySearchPageToState,
    applyDemoAuditFallback,
    runSearch,
    loadMore,
  };
}

export type AuditPageSearchQueryState = ReturnType<typeof useAuditPageSearchQuery>;
