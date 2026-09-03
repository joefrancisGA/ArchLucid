"use client";

import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  auditTrailDateRangePresetHrefFromSearch,
} from "@/lib/governance/audit-trail-date-range-url";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import type { AuditFilterFields } from "./audit-page-helpers";
import { resolveAuditScopedRunId, shouldDeferAuditAutoSearch, toDatetimeLocalInputValue } from "./audit-page-helpers";
import { resolveAuditSearchPageForUi, shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";
import type { UseAuditPageFiltersResult } from "./use-audit-page-filters";
import {
  auditFiltersToQueryRecord,
  fetchAuditEventsSearch,
} from "./audit-events-query-fetch";

export type UseAuditPageQueryResult = {
  readonly failure: ApiLoadFailureState | null;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
  readonly searching: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly runSearch: () => Promise<void>;
  readonly clearFiltersAndSearch: () => Promise<void>;
  readonly events: AuditEvent[];
  readonly hasMoreResults: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => Promise<void>;
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => Promise<void>;
  readonly clearDateRangeAndSearch: () => Promise<void>;
  readonly executeSearch: (filters: AuditFilterFields, loadMoreCursor?: string | null) => Promise<CursorPagedResponse<AuditEvent>>;
  readonly applySearchPageToState: (page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields) => void;
  readonly applyDemoAuditFallback: () => void;
  readonly setSearching: Dispatch<SetStateAction<boolean>>;
};

export function useAuditPageQuery(filters: UseAuditPageFiltersResult): UseAuditPageQueryResult {
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const initialAutoSearchPrimedRef = useRef(false);
  const lastAutoSearchUrlRunIdRef = useRef<string | null>(null);

  const executeSearch = useCallback(
    async (filterFields: AuditFilterFields, loadMoreCursor?: string | null) => {
      setFailure(null);

      return queryClient.fetchQuery({
        queryKey: operatorQueryKeys.auditEventsSearch(
          scope,
          auditFiltersToQueryRecord(filterFields),
          loadMoreCursor ?? null,
        ),
        queryFn: () => fetchAuditEventsSearch(filterFields, loadMoreCursor),
        staleTime: 0,
        gcTime: OPERATOR_QUERY_GC_MS,
      });
    },
    [queryClient, scope],
  );

  const applySearchPageToState = useCallback((page: CursorPagedResponse<AuditEvent>, filterFields: AuditFilterFields) => {
    const slice = resolveAuditSearchPageForUi(page, filterFields);

    setEvents(slice.events);
    setHasMoreResults(slice.hasMoreResults);
    setAuditNextCursor(slice.auditNextCursor);
    setLastRefreshedAt(new Date());
    filters.applyBuyerPolishedDateRangeFromEvents(slice.events.map((event) => event.occurredUtc));
  }, [filters]);

  const applyDemoAuditFallback = useCallback(() => {
    const demoEvents = getDemoSampleAuditTrailEvents();
    setEvents(demoEvents);
    setHasMoreResults(false);
    setAuditNextCursor(null);
    setFailure(null);
    setLastRefreshedAt(new Date());
    filters.applyBuyerPolishedDateRangeFromEvents(demoEvents.map((event) => event.occurredUtc));
  }, [filters]);

  const runSearch = useCallback(async () => {
    setSearching(true);

    try {
      const filterFields = filters.currentFilters();
      const page = await executeSearch(filterFields);

      applySearchPageToState(page, filterFields);
    } catch (e) {
      const emptyFilters = filters.currentFilters();

      if (shouldInjectAuditDemoOnSearchError(emptyFilters)) {
        applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applyDemoAuditFallback, applySearchPageToState, executeSearch, filters]);

  const applyAuditDatePreset = useCallback(
    async (preset: "24h" | "7d") => {
      const hours = preset === "24h" ? 24 : 168;
      const fromStr = toDatetimeLocalInputValue(new Date(Date.now() - hours * 3600 * 1000));

      filters.setAuditDatePreset(preset);
      filters.setFromUtc(fromStr);
      filters.setToUtc("");
      router.replace(
        auditTrailDateRangePresetHrefFromSearch(searchParams.toString(), preset, pathname ?? GOVERNANCE_AUDIT_PATH),
        { scroll: false },
      );
      setFailure(null);
      setSearching(true);

      const filterFields: AuditFilterFields = {
        eventType: filters.eventType,
        fromUtc: fromStr,
        toUtc: "",
        correlationId: filters.correlationId,
        actorUserId: filters.actorUserId,
        runId: filters.runId,
      };

      try {
        const page = await executeSearch(filterFields);

        applySearchPageToState(page, filterFields);
      } catch (e) {
        if (shouldInjectAuditDemoOnSearchError(filterFields)) {
          applyDemoAuditFallback();
        } else {
          setFailure(toApiLoadFailure(e));
        }
      } finally {
        setSearching(false);
      }
    },
    [applyDemoAuditFallback, applySearchPageToState, executeSearch, filters, pathname, router, searchParams],
  );

  const clearDateRangeAndSearch = useCallback(async () => {
    filters.setAuditDatePreset(null);
    filters.setFromUtc("");
    filters.setToUtc("");
    router.replace(
      auditTrailDateRangePresetHrefFromSearch(searchParams.toString(), null, pathname ?? GOVERNANCE_AUDIT_PATH),
      { scroll: false },
    );
    setFailure(null);
    setSearching(true);

    const filterFields: AuditFilterFields = {
      eventType: filters.eventType,
      fromUtc: "",
      toUtc: "",
      correlationId: filters.correlationId,
      actorUserId: filters.actorUserId,
      runId: filters.runId,
    };

    try {
      const page = await executeSearch(filterFields);

      applySearchPageToState(page, filterFields);
    } catch (e) {
      if (shouldInjectAuditDemoOnSearchError(filterFields)) {
        applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applyDemoAuditFallback, applySearchPageToState, executeSearch, filters, pathname, router, searchParams]);

  const clearFiltersAndSearch = useCallback(async () => {
    filters.resetFilterFields();
    setSearching(true);
    setFailure(null);

    const empty: AuditFilterFields = {
      eventType: "",
      fromUtc: "",
      toUtc: "",
      correlationId: "",
      actorUserId: "",
      runId: "",
    };

    try {
      const page = await executeSearch(empty);

      applySearchPageToState(page, empty);
    } catch (e) {
      if (shouldInjectAuditDemoOnSearchError(empty)) {
        applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applyDemoAuditFallback, applySearchPageToState, executeSearch, filters]);

  const loadMore = useCallback(async () => {
    if (events.length === 0) {
      return;
    }

    if (!auditNextCursor) {
      return;
    }

    setLoadingMore(true);
    setFailure(null);

    try {
      const page = await executeSearch(filters.currentFilters(), auditNextCursor);

      setHasMoreResults(page.hasMore);
      setAuditNextCursor(page.nextCursor);

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
  }, [auditNextCursor, events.length, executeSearch, filters]);

  useEffect(() => {
    const urlRunIdParam = searchParams.get("runId")?.trim() ?? "";
    const scopedRunId = resolveAuditScopedRunId({
      urlRunId: urlRunIdParam,
      pathname: pathname ?? GOVERNANCE_AUDIT_PATH,
      search: searchParams.toString(),
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });

    if (shouldDeferAuditAutoSearch(filters.runId, scopedRunId)) {
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
  }, [filters.runId, pathname, runSearch, searchParams, workspaceRun?.activeRunId]);

  return {
    failure,
    setFailure,
    searching,
    lastRefreshedAt,
    runSearch,
    clearFiltersAndSearch,
    events,
    hasMoreResults,
    loadingMore,
    loadMore,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
    executeSearch,
    applySearchPageToState,
    applyDemoAuditFallback,
    setSearching,
  };
}
