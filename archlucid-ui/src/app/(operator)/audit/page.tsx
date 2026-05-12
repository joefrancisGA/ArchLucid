"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpLink } from "@/components/HelpLink";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AuditLogRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import {
  useNavCallerAuthorityRank,
  useOperatorNavAuthority,
} from "@/components/OperatorNavAuthorityProvider";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { downloadAuditExportCsv, getAuditEventTypes, searchAuditEvents } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  auditBuyerEventIsSystemRecordedActor,
  auditEventLifecycleSortKey,
  auditEventsAreLifecycleOnlyForGrouping,
  buyerAuditTrailMetricCounts,
  canExportAuditCsv,
  formatAuditSummaryHeading,
  formatBuyerAuditTrailSummaryLine,
  groupAuditEventsByLifecycleStage,
  principalRolesAllowAuditCsvExport,
} from "@/app/(operator)/audit/audit-ui-helpers";
import { AuditBuyerHeaderMetrics } from "@/app/(operator)/audit/_sections/AuditBuyerHeaderMetrics";
import { AuditOperatorExportSection } from "@/app/(operator)/audit/_sections/AuditOperatorExportSection";
import { AuditResultsSection } from "@/app/(operator)/audit/_sections/AuditResultsSection";
import { AuditSearchSection } from "@/app/(operator)/audit/_sections/AuditSearchSection";
import {
  AUDIT_PAGE_SIZE,
  type AuditFilterFields,
  toDatetimeLocalInputValue,
} from "@/app/(operator)/audit/_sections/audit-page-helpers";
import {
  auditExportExecuteRankAuditorRoleNote,
  auditSearchNoResultsBuyerPolishedLine,
  auditSearchNoResultsOperatorLine,
  auditSearchNoResultsReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  getDemoSampleAuditTrailEvents,
  shouldInjectDemoAuditSample,
  shouldPreferCuratedAuditTrailForBuyerShell,
} from "@/lib/demo-audit-sample-events";
import { isNextPublicDemoMode, isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { isStaticDemoPayloadFallbackEnabled, shouldMergeOperatorDemoAlertSample } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export default function AuditPage() {
  const { currentPrincipal } = useOperatorNavAuthority();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canMutateEnterpriseShell = useEnterpriseMutationCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpen] = useState(!buyerPolishedShell);
  const [buyerPrimaryFiltersOpen, setBuyerPrimaryFiltersOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
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
  const [loadingTypes, setLoadingTypes] = useState(true);
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
    void loadTypes();
  }, [loadTypes]);

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

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const filters = currentFilters();
      const page = await executeSearch(filters);
      const curatedBuyer =
        shouldMergeOperatorDemoAlertSample() && shouldPreferCuratedAuditTrailForBuyerShell(filters);
      const injectEmptyOnly =
        shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters) && page.items.length === 0;

      const useDemoRows = curatedBuyer || injectEmptyOnly;

      setEvents(useDemoRows ? getDemoSampleAuditTrailEvents() : page.items);
      setHasMoreResults(useDemoRows ? false : page.hasMore);
      setAuditNextCursor(useDemoRows ? null : page.nextCursor);
    } catch (e) {
      const emptyFilters = currentFilters();
      const injectOnError =
        shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(emptyFilters);

      if (injectOnError) {
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
  }, [currentFilters, executeSearch]);

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
        const curatedBuyer =
          shouldMergeOperatorDemoAlertSample() && shouldPreferCuratedAuditTrailForBuyerShell(filters);
        const injectEmptyOnly =
          shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters) && page.items.length === 0;
        const useDemoRows = curatedBuyer || injectEmptyOnly;

        setEvents(useDemoRows ? getDemoSampleAuditTrailEvents() : page.items);
        setHasMoreResults(useDemoRows ? false : page.hasMore);
        setAuditNextCursor(useDemoRows ? null : page.nextCursor);
      } catch (e) {
        const injectOnError = shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters);

        if (injectOnError) {
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
    [actorUserId, correlationId, eventType, executeSearch, runId],
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
      const curatedBuyer = shouldMergeOperatorDemoAlertSample() && shouldPreferCuratedAuditTrailForBuyerShell(filters);
      const injectEmptyOnly =
        shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters) && page.items.length === 0;
      const useDemoRows = curatedBuyer || injectEmptyOnly;

      setEvents(useDemoRows ? getDemoSampleAuditTrailEvents() : page.items);
      setHasMoreResults(useDemoRows ? false : page.hasMore);
      setAuditNextCursor(useDemoRows ? null : page.nextCursor);
    } catch (e) {
      const injectOnError = shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters);

      if (injectOnError) {
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
  }, [actorUserId, correlationId, eventType, executeSearch, runId]);

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
      const curatedBuyer = shouldMergeOperatorDemoAlertSample() && shouldPreferCuratedAuditTrailForBuyerShell(empty);
      const injectEmptyOnly =
        shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(empty) && page.items.length === 0;
      const useDemoRows = curatedBuyer || injectEmptyOnly;

      setEvents(useDemoRows ? getDemoSampleAuditTrailEvents() : page.items);
      setHasMoreResults(useDemoRows ? false : page.hasMore);
      setAuditNextCursor(useDemoRows ? null : page.nextCursor);
    } catch (e) {
      const injectOnError = shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(empty);

      if (injectOnError) {
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
  }, [executeSearch]);

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
  }, [currentFilters, events.length, auditNextCursor, executeSearch]);

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
  const auditSearchEmptyLine = buyerPolishedShell
    ? auditSearchNoResultsBuyerPolishedLine
    : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
      ? auditSearchNoResultsReaderLine
      : auditSearchNoResultsOperatorLine;

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

  return (
    <div className={buyerPolishedShell ? "max-w-6xl" : "max-w-4xl"}>
      <LayerHeader pageKey="audit" />
      <OperatorPageHeader
        title={
          buyerPolishedShell
            ? `Audit trail for ${buyerFacingReviewLinkLabelFromRunId(
                runId.trim().length > 0 ? runId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID,
              )}`
            : "Audit log"
        }
        helpKey="audit-log"
        actions={
          <HelpLink
            docPath="/docs/library/AUDIT_COVERAGE_MATRIX.md"
            label="Audit coverage matrix documentation on GitHub (new tab)"
          />
        }
      />
      {buyerPolishedShell ? (
        <AuditBuyerHeaderMetrics
          buyerAuditTrailSummaryLine={buyerAuditTrailSummaryLine}
          buyerAuditTrailMetrics={buyerAuditTrailMetrics}
          displayEventCount={displayEvents.length}
          exportRoleOk={exportRoleOk}
        />
      ) : null}

      <AuditLogRankCue className="mb-2" />

      {callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority && !exportRoleOk && !buyerPolishedShell ? (
        <p className="mb-2 max-w-prose text-xs text-neutral-600 dark:text-neutral-400" role="note">
          {auditExportExecuteRankAuditorRoleNote}
        </p>
      ) : null}

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className={cn(buyerPolishedShell && "flex flex-col")}>
        <div className={cn(buyerPolishedShell && "order-2")}>
          <AuditSearchSection
            buyerPolishedShell={buyerPolishedShell}
            callerAuthorityRank={callerAuthorityRank}
            canMutateEnterpriseShell={canMutateEnterpriseShell}
            advancedAuditFiltersOpen={advancedAuditFiltersOpen}
            setAdvancedAuditFiltersOpen={setAdvancedAuditFiltersOpen}
            buyerPrimaryFiltersOpen={buyerPrimaryFiltersOpen}
            setBuyerPrimaryFiltersOpen={setBuyerPrimaryFiltersOpen}
            eventTypes={eventTypes}
            eventType={eventType}
            setEventType={setEventType}
            fromUtc={fromUtc}
            setFromUtc={setFromUtc}
            toUtc={toUtc}
            setToUtc={setToUtc}
            correlationId={correlationId}
            setCorrelationId={setCorrelationId}
            actorUserId={actorUserId}
            setActorUserId={setActorUserId}
            runId={runId}
            setRunId={setRunId}
            searching={searching}
            loadingTypes={loadingTypes}
            auditDatePreset={auditDatePreset}
            applyAuditDatePreset={applyAuditDatePreset}
            clearDateRangeAndSearch={clearDateRangeAndSearch}
            runSearch={runSearch}
            clearFiltersAndSearch={clearFiltersAndSearch}
          />
        </div>

        <div className={cn(buyerPolishedShell && "order-1")}>
          <AuditResultsSection
            buyerPolishedShell={buyerPolishedShell}
            callerAuthorityRank={callerAuthorityRank}
            events={events}
            displayEvents={displayEvents}
            displayEventGroups={displayEventGroups}
            hasMoreResults={hasMoreResults}
            loadingMore={loadingMore}
            searching={searching}
            uniformRunIdForDisplay={uniformRunIdForDisplay}
            auditSearchEmptyLine={auditSearchEmptyLine}
            loadMore={loadMore}
            csvExportUiAllowed={csvExportUiAllowed}
            exporting={exporting}
            exportDateRangeReady={exportDateRangeReady}
            exportRoleOk={exportRoleOk}
            onExportCsv={onExportCsv}
          />
        </div>
      </div>

      {events.length > 0 && !buyerPolishedShell ? (
        <AuditOperatorExportSection
          csvExportUiAllowed={csvExportUiAllowed}
          exporting={exporting}
          searching={searching}
          exportDateRangeReady={exportDateRangeReady}
          exportRoleOk={exportRoleOk}
          onExportCsv={onExportCsv}
        />
      ) : null}
    </div>
  );
}
