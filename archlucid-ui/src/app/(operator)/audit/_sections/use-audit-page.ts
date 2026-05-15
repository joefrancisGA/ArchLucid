"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  auditEventLifecycleSortKey,
  auditEventsAreLifecycleOnlyForGrouping,
  buyerAuditTrailMetricCounts,
  canExportAuditCsv,
  formatBuyerAuditTrailSummaryLine,
  groupAuditEventsByLifecycleStage,
  principalRolesAllowAuditCsvExport,
} from "@/app/(operator)/audit/audit-ui-helpers";
import { useNavCallerAuthorityRank, useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { downloadAuditExportCsv, getAuditEventTypes, searchAuditEvents } from "@/lib/api";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  auditSearchNoResultsBuyerPolishedLine,
  auditSearchNoResultsOperatorLine,
  auditSearchNoResultsReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isStaticDemoPayloadFallbackEnabled, shouldMergeOperatorDemoAlertSample } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import type { AuditPageViewProps } from "./audit-page-view-props";
import type { AuditPageServerLoad } from "./load-audit-page-data";
import {
  AUDIT_PAGE_SIZE,
  type AuditFilterFields,
  toDatetimeLocalInputValue,
} from "./audit-page-helpers";
import { resolveAuditSearchPageForUi, shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";

/** Page controller: audit filters, search/export, and derived buyer display state. */
export function useAuditPage(serverLoad: AuditPageServerLoad): AuditPageViewProps {
  const { currentPrincipal } = useOperatorNavAuthority();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canMutateEnterpriseShell = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpen] = useState(!buyerPolishedShell);
  const [buyerPrimaryFiltersOpen, setBuyerPrimaryFiltersOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>(serverLoad.eventTypes);
  const [eventType, setEventType] = useState<string>("");
  const [fromUtc, setFromUtc] = useState<string>("");
  const [toUtc, setToUtc] = useState<string>("");
  const [correlationId, setCorrelationId] = useState<string>("");
  const [actorUserId, setActorUserId] = useState<string>("");
  const [runId, setRunId] = useState<string>(() =>
    isBuyerPolishedOperatorShellEnv() || isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()
      ? SHOWCASE_STATIC_DEMO_RUN_ID
      : "",
  );
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(serverLoad.typesLoadFailure !== null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [auditDatePreset, setAuditDatePreset] = useState<null | "24h" | "7d">(null);
  const demoAuditPrimedRef = useRef(false);

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

      const payload = {
        eventType: filters.eventType || undefined,
        fromUtc: filters.fromUtc ? new Date(filters.fromUtc).toISOString() : undefined,
        toUtc: filters.toUtc ? new Date(filters.toUtc).toISOString() : undefined,
        cursor: loadMoreCursor ?? undefined,
        correlationId: filters.correlationId.trim() || undefined,
        actorUserId: filters.actorUserId.trim() || undefined,
        runId: filters.runId.trim() || undefined,
        take: AUDIT_PAGE_SIZE,
      };

      const data: CursorPagedResponse<AuditEvent> = await searchAuditEvents(payload);

      return data;
    },
    [],
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
        setEvents(getDemoSampleAuditTrailEvents());
        setHasMoreResults(false);
        setAuditNextCursor(null);
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applySearchPageToState, currentFilters, executeSearch]);

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
          setEvents(getDemoSampleAuditTrailEvents());
          setHasMoreResults(false);
          setAuditNextCursor(null);
          setFailure(null);
        } else {
          setFailure(toApiLoadFailure(e));
        }
      } finally {
        setSearching(false);
      }
    },
    [actorUserId, applySearchPageToState, correlationId, eventType, executeSearch, runId],
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
        setEvents(getDemoSampleAuditTrailEvents());
        setHasMoreResults(false);
        setAuditNextCursor(null);
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [actorUserId, applySearchPageToState, correlationId, eventType, executeSearch, runId]);

  useEffect(() => {
    if (!shouldMergeOperatorDemoAlertSample() || demoAuditPrimedRef.current) {
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
        setEvents(getDemoSampleAuditTrailEvents());
        setHasMoreResults(false);
        setAuditNextCursor(null);
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setSearching(false);
    }
  }, [applySearchPageToState, executeSearch]);

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

  const onExportCsv = useCallback(async () => {
    if (!canExportAuditCsv(fromUtc, toUtc) || !principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues)) {
      return;
    }

    setExporting(true);
    setFailure(null);

    try {
      const filters = currentFilters();

      await downloadAuditExportCsv({
        fromUtcIso: new Date(fromUtc).toISOString(),
        toUtcIso: new Date(toUtc).toISOString(),
        maxRows: 10_000,
        eventType: filters.eventType.trim() || undefined,
        correlationId: filters.correlationId.trim() || undefined,
        actorUserId: filters.actorUserId.trim() || undefined,
        runId: filters.runId.trim() || undefined,
      });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setExporting(false);
    }
  }, [currentFilters, currentPrincipal.roleClaimValues, fromUtc, toUtc]);

  const exportDateRangeReady = canExportAuditCsv(fromUtc, toUtc);
  const exportRoleOk = principalRolesAllowAuditCsvExport(currentPrincipal.roleClaimValues);
  const csvExportUiAllowed = exportDateRangeReady && exportRoleOk;

  const auditSearchEmptyLine = useMemo(
    () =>
      buyerPolishedShell
        ? auditSearchNoResultsBuyerPolishedLine
        : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
          ? auditSearchNoResultsReaderLine
          : auditSearchNoResultsOperatorLine,
    [buyerPolishedShell, callerAuthorityRank],
  );

  const displayEvents = useMemo(() => {
    if (!buyerPolishedShell) {
      return events;
    }

    return [...events].sort((eventA, eventB) => {
      const rankDiff =
        auditEventLifecycleSortKey(eventA.eventType) - auditEventLifecycleSortKey(eventB.eventType);

      if (rankDiff !== 0) {
        return rankDiff;
      }

      return eventA.occurredUtc.localeCompare(eventB.occurredUtc);
    });
  }, [buyerPolishedShell, events]);

  const displayEventGroups = useMemo(() => {
    const eligible = buyerPolishedShell && auditEventsAreLifecycleOnlyForGrouping(displayEvents);

    if (!eligible) {
      return null;
    }

    return groupAuditEventsByLifecycleStage(displayEvents);
  }, [buyerPolishedShell, displayEvents]);

  const uniformRunIdForDisplay = useMemo(() => {
    if (displayEvents.length === 0) {
      return null;
    }

    const firstId = displayEvents[0].runId?.trim() ?? "";

    if (firstId.length === 0) {
      return null;
    }

    const allSame = displayEvents.every((ev) => (ev.runId?.trim() ?? "") === firstId);

    return allSame ? firstId : null;
  }, [displayEvents]);

  const buyerAuditTrailSummaryLine = useMemo(() => {
    if (!buyerPolishedShell || displayEvents.length === 0) {
      return null;
    }

    return formatBuyerAuditTrailSummaryLine(displayEvents, uniformRunIdForDisplay, runId);
  }, [buyerPolishedShell, displayEvents, uniformRunIdForDisplay, runId]);

  const buyerAuditTrailMetrics = useMemo(() => {
    if (!buyerPolishedShell || displayEvents.length === 0) {
      return null;
    }

    return buyerAuditTrailMetricCounts(displayEvents);
  }, [buyerPolishedShell, displayEvents]);

  return {
    buyerPolishedShell,
    runId,
    buyerAuditTrailSummaryLine,
    buyerAuditTrailMetrics,
    displayEvents,
    callerAuthorityRank,
    exportRoleOk,
    failure,
    canMutateEnterpriseShell,
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
    loadingTypes,
    auditDatePreset,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
    runSearch,
    clearFiltersAndSearch,
    events,
    displayEventGroups,
    hasMoreResults,
    loadingMore,
    uniformRunIdForDisplay,
    auditSearchEmptyLine,
    loadMore,
    csvExportUiAllowed,
    exporting,
    exportDateRangeReady,
    onExportCsv,
  };
}
