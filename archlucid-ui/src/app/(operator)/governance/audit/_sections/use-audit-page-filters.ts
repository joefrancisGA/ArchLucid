"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { getAuditEventTypes } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import {
  CTO_DEMO_AUDIT_FILTER_QUERY_PARAM,
  CTO_DEMO_AUDIT_FILTER_VALUE,
  isCtoDemoAuditFilterActive,
} from "@/lib/cto-demo-audit-filter";
import {
  type AuditTrailViewMode,
  defaultAuditTrailViewMode,
  readAuditTrailViewModeFromStorage,
  resolveAuditTrailViewMode,
  writeAuditTrailViewModeToStorage,
} from "@/lib/audit-trail-view-mode";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { AuditSavedViewFilters } from "@/lib/operator/operator-saved-view-types";
import type { AuditPageServerLoad } from "./load-audit-page-data";
import {
  type AuditFilterFields,
  buildAuditSavedViewPayload,
  toDatetimeLocalInputValue,
} from "./audit-page-helpers";
import { resolveAuditSearchPageForUi, shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";
import {
  auditFiltersToQueryRecord,
  fetchAuditEventsSearch,
} from "./audit-events-query-fetch";

export type UseAuditPageFiltersResult = {
  readonly buyerPolishedShell: boolean;
  readonly viewMode: AuditTrailViewMode;
  readonly onViewModeChange: (mode: AuditTrailViewMode) => void;
  readonly runId: string;
  readonly failure: ApiLoadFailureState | null;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
  readonly advancedAuditFiltersOpen: boolean;
  readonly setAdvancedAuditFiltersOpen: (open: boolean) => void;
  readonly buyerPrimaryFiltersOpen: boolean;
  readonly setBuyerPrimaryFiltersOpen: (open: boolean) => void;
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: (value: string) => void;
  readonly fromUtc: string;
  readonly setFromUtc: (value: string) => void;
  readonly toUtc: string;
  readonly setToUtc: (value: string) => void;
  readonly correlationId: string;
  readonly setCorrelationId: (value: string) => void;
  readonly actorUserId: string;
  readonly setActorUserId: (value: string) => void;
  readonly setRunId: (value: string) => void;
  readonly searching: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => Promise<void>;
  readonly clearDateRangeAndSearch: () => Promise<void>;
  readonly runSearch: () => Promise<void>;
  readonly clearFiltersAndSearch: () => Promise<void>;
  readonly events: AuditEvent[];
  readonly hasMoreResults: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => Promise<void>;
  readonly getAuditSavedViewPayload: () => ReturnType<typeof buildAuditSavedViewPayload>;
  readonly loadAuditSavedView: (view: OperatorSavedView) => Promise<void>;
  readonly ctoDemoAuditFilterActive: boolean;
  readonly onClearCtoDemoAuditFilter: () => void;
  readonly auditFiltersActive: boolean;
};

export function useAuditPageFilters(serverLoad: AuditPageServerLoad): UseAuditPageFiltersResult {
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [viewMode, setViewModeState] = useState<AuditTrailViewMode>(() =>
    defaultAuditTrailViewMode(buyerPolishedShell),
  );
  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpen] = useState(!buyerPolishedShell);
  const [buyerPrimaryFiltersOpen, setBuyerPrimaryFiltersOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>(serverLoad.eventTypes);
  const [eventType, setEventType] = useState<string>("");
  const [fromUtc, setFromUtc] = useState<string>("");
  const [toUtc, setToUtc] = useState<string>("");
  const [correlationId, setCorrelationId] = useState<string>("");
  const [actorUserId, setActorUserId] = useState<string>("");
  const [runId, setRunId] = useState<string>("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(serverLoad.typesLoadFailure !== null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [auditDatePreset, setAuditDatePreset] = useState<null | "24h" | "7d">(null);
  const demoAuditPrimedRef = useRef(false);
  const ctoDemoAuditFilterActive = isCtoDemoAuditFilterActive(searchParams.get(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM));

  useEffect(() => {
    const storedMode = readAuditTrailViewModeFromStorage();
    const resolved = resolveAuditTrailViewMode({
      buyerPolishedShell,
      storedMode,
    });

    setViewModeState(resolved);
  }, [buyerPolishedShell]);

  const onViewModeChange = useCallback((mode: AuditTrailViewMode) => {
    setViewModeState(mode);
    writeAuditTrailViewModeToStorage(mode);
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get("runId")?.trim() ?? "";

    if (fromQuery.length > 0) {
      setRunId(fromQuery);

      return;
    }

    const resolvedRunId = resolveOperatorShellAuditRunId({
      pathname: pathname ?? GOVERNANCE_AUDIT_PATH,
      search: searchParams.toString(),
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });

    if (resolvedRunId === null || resolvedRunId.length === 0) {
      return;
    }

    router.replace(auditTrailNavHref(resolvedRunId), { scroll: false });
    setRunId(resolvedRunId);
  }, [pathname, router, searchParams, workspaceRun?.activeRunId]);

  const onClearCtoDemoAuditFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM);
    const query = params.toString();

    router.replace(
      query.length > 0 ? `${GOVERNANCE_AUDIT_PATH}?${query}` : GOVERNANCE_AUDIT_PATH,
      { scroll: false },
    );
  }, [router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!readBuyerCtoDemoTourActive()) {
      return;
    }

    const existingFilter = searchParams.get(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM);

    if (existingFilter !== null && existingFilter.trim().length > 0) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM, CTO_DEMO_AUDIT_FILTER_VALUE);
    router.replace(`${GOVERNANCE_AUDIT_PATH}?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    setFailure(null);

    try {
      const types = await getAuditEventTypes();
      setEventTypes(types);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (serverLoad.typesLoadFailure === null) {
      return;
    }

    void loadTypes();
  }, [loadTypes, serverLoad.typesLoadFailure]);

  useEffect(() => {
    if (!buyerPolishedShell || events.length === 0) {
      return;
    }

    const sorted = [...events].map((e) => e.occurredUtc).sort((a, b) => a.localeCompare(b));
    const firstUtc = sorted[0];
    const lastUtc = sorted[sorted.length - 1];

    if (firstUtc === undefined || lastUtc === undefined) {
      return;
    }

    setFromUtc(toDatetimeLocalInputValue(new Date(firstUtc)));
    setToUtc(toDatetimeLocalInputValue(new Date(lastUtc)));
  }, [buyerPolishedShell, events]);

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
    [queryClient, scope],
  );

  const currentFilters = useCallback(
    (): AuditFilterFields => ({
      eventType,
      fromUtc,
      toUtc,
      correlationId,
      actorUserId,
      runId,
    }),
    [actorUserId, correlationId, eventType, fromUtc, runId, toUtc],
  );

  const applySearchPageToState = useCallback((page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields) => {
    const slice = resolveAuditSearchPageForUi(page, filters);

    setEvents(slice.events);
    setHasMoreResults(slice.hasMoreResults);
    setAuditNextCursor(slice.auditNextCursor);
    setLastRefreshedAt(new Date());
  }, []);

  const applyDemoAuditFallback = useCallback(() => {
    setEvents(getDemoSampleAuditTrailEvents());
    setHasMoreResults(false);
    setAuditNextCursor(null);
    setFailure(null);
    setLastRefreshedAt(new Date());
  }, []);

  const runSearch = useCallback(async () => {
    setSearching(true);

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
  }, [applyDemoAuditFallback, applySearchPageToState, currentFilters, executeSearch]);

  const applyAuditDatePreset = useCallback(
    async (preset: "24h" | "7d") => {
      const hours = preset === "24h" ? 24 : 168;
      const fromStr = toDatetimeLocalInputValue(new Date(Date.now() - hours * 3600 * 1000));

      setAuditDatePreset(preset);
      setFromUtc(fromStr);
      setToUtc("");
      setFailure(null);
      setSearching(true);

      const filters: AuditFilterFields = {
        eventType,
        fromUtc: fromStr,
        toUtc: "",
        correlationId,
        actorUserId,
        runId,
      };

      try {
        const page = await executeSearch(filters);

        applySearchPageToState(page, filters);
      } catch (e) {
        if (shouldInjectAuditDemoOnSearchError(filters)) {
          applyDemoAuditFallback();
        } else {
          setFailure(toApiLoadFailure(e));
        }
      } finally {
        setSearching(false);
      }
    },
    [actorUserId, applyDemoAuditFallback, applySearchPageToState, correlationId, eventType, executeSearch, runId],
  );

  const clearDateRangeAndSearch = useCallback(async () => {
    setAuditDatePreset(null);
    setFromUtc("");
    setToUtc("");
    setFailure(null);
    setSearching(true);

    const filters: AuditFilterFields = {
      eventType,
      fromUtc: "",
      toUtc: "",
      correlationId,
      actorUserId,
      runId,
    };

    try {
      const page = await executeSearch(filters);

      applySearchPageToState(page, filters);
    } catch (e) {
      if (shouldInjectAuditDemoOnSearchError(filters)) {
        applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [actorUserId, applyDemoAuditFallback, applySearchPageToState, correlationId, eventType, executeSearch, runId]);

  useEffect(() => {
    if (demoAuditPrimedRef.current) {
      return;
    }

    demoAuditPrimedRef.current = true;
    void runSearch();
  }, [runSearch]);

  const clearFiltersAndSearch = useCallback(async () => {
    setAuditDatePreset(null);
    setEventType("");
    setFromUtc("");
    setToUtc("");
    setCorrelationId("");
    setActorUserId("");
    setRunId("");
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
  }, [applyDemoAuditFallback, applySearchPageToState, executeSearch]);

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
      const page = await executeSearch(currentFilters(), auditNextCursor);

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
  }, [auditNextCursor, currentFilters, events.length, executeSearch]);

  const getAuditSavedViewPayload = useCallback(
    () => buildAuditSavedViewPayload(currentFilters(), auditDatePreset, advancedAuditFiltersOpen),
    [advancedAuditFiltersOpen, auditDatePreset, currentFilters],
  );

  const loadAuditSavedView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as AuditSavedViewFilters;
      const nextFilters: AuditFilterFields = {
        eventType: filters.eventType ?? "",
        fromUtc: filters.fromUtc ?? "",
        toUtc: filters.toUtc ?? "",
        correlationId: filters.correlationId ?? "",
        actorUserId: filters.actorUserId ?? "",
        runId: filters.runId ?? "",
      };

      setEventType(nextFilters.eventType);
      setFromUtc(nextFilters.fromUtc);
      setToUtc(nextFilters.toUtc);
      setCorrelationId(nextFilters.correlationId);
      setActorUserId(nextFilters.actorUserId);
      setRunId(nextFilters.runId);
      setAuditDatePreset(filters.auditDatePreset ?? null);
      setAdvancedAuditFiltersOpen(
        filters.advancedAuditFiltersOpen ?? view.payload.columnVisibility?.showAdvancedFilters === true,
      );
      setSearching(true);
      setFailure(null);

      try {
        const page = await executeSearch(nextFilters);

        applySearchPageToState(page, nextFilters);
      } catch (error) {
        if (shouldInjectAuditDemoOnSearchError(nextFilters)) {
          applyDemoAuditFallback();
        } else {
          setFailure(toApiLoadFailure(error));
        }
      } finally {
        setSearching(false);
      }
    },
    [applyDemoAuditFallback, applySearchPageToState, executeSearch],
  );

  const auditFiltersActive =
    eventType.trim().length > 0 ||
    fromUtc.trim().length > 0 ||
    toUtc.trim().length > 0 ||
    correlationId.trim().length > 0 ||
    actorUserId.trim().length > 0 ||
    runId.trim().length > 0 ||
    auditDatePreset !== null;

  return {
    buyerPolishedShell,
    viewMode,
    onViewModeChange,
    runId,
    failure,
    setFailure,
    advancedAuditFiltersOpen,
    setAdvancedAuditFiltersOpen,
    buyerPrimaryFiltersOpen,
    setBuyerPrimaryFiltersOpen,
    eventTypes,
    eventType,
    setEventType,
    fromUtc,
    setFromUtc,
    toUtc,
    setToUtc,
    correlationId,
    setCorrelationId,
    actorUserId,
    setActorUserId,
    setRunId,
    searching,
    lastRefreshedAt,
    loadingTypes,
    auditDatePreset,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
    runSearch,
    clearFiltersAndSearch,
    events,
    hasMoreResults,
    loadingMore,
    loadMore,
    getAuditSavedViewPayload,
    loadAuditSavedView,
    ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter,
    auditFiltersActive,
  };
}
