"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpLink } from "@/components/HelpLink";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AuditLogRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  auditEventLifecycleSortKey,
  auditEventsAreLifecycleOnlyForGrouping,
  canExportAuditCsv,
  formatAuditSummaryHeading,
  groupAuditEventsByLifecycleStage,
  principalRolesAllowAuditCsvExport,
} from "@/app/(operator)/audit/audit-ui-helpers";
import {
  auditExportControlDisabledTitle,
  auditExportCsvButtonLabelRoleRestricted,
  auditExportCsvButtonLabelWindowIncomplete,
  auditExportExecuteRankAuditorRoleNote,
  auditExportSectionSupportingLine,
  auditExportSectionSupportingLineBuyerPolished,
  auditClearFiltersButtonLabelReaderRank,
  auditLoadMoreButtonTitleOperator,
  auditLoadMoreButtonTitleReader,
  auditResultsSectionHeadingOperator,
  auditResultsSectionHeadingReader,
  auditResultsSectionHeadingBuyerPolished,
  auditSearchEventsButtonLabelReaderRank,
  auditSearchEventsButtonTitleOperator,
  auditSearchEventsButtonTitleReader,
  auditSearchEventsSectionHeadingOperator,
  auditSearchEventsSectionHeadingReader,
  auditSearchEventsSectionHeadingBuyerPolished,
  auditSearchNoResultsBuyerPolishedLine,
  auditSearchNoResultsOperatorLine,
  auditSearchNoResultsReaderLine,
  auditSearchSectionLeadBuyerPolishedLine,
  auditSearchSectionLeadReaderLine,
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
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

function formatUtc(iso: string): string {
  try {
    const d = new Date(iso);

    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

const AUDIT_PAGE_SIZE = 200;

function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tryFormatDataJson(dataJson: string): string {
  try {
    const parsed: unknown = JSON.parse(dataJson);

    return JSON.stringify(parsed, null, 2);
  } catch {
    return dataJson;
  }
}

interface AuditFilterFields {
  eventType: string;
  fromUtc: string;
  toUtc: string;
  correlationId: string;
  actorUserId: string;
  runId: string;
}

function BuyerAuditEventsTechnicalAppendix(props: { events: AuditEvent[] }) {
  const { events } = props;

  return (
    <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Technical appendix — identifiers and payloads for all events above
      </summary>
      <div className="mt-3 space-y-4">
        {events.map((ev) => (
          <div
            key={ev.eventId}
            className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-700"
          >
            <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {formatUtc(ev.occurredUtc)} · {pipelineEventTypeFriendlyLabel(ev.eventType)}
            </p>
            <div className="mt-2 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
              <div>
                <span className="font-medium text-neutral-600 dark:text-neutral-400">User id</span>{" "}
                <span className="font-mono text-xs">{ev.actorUserId}</span>
              </div>
              <div>
                <span className="font-medium text-neutral-600 dark:text-neutral-400">Correlation ID</span>{" "}
                <span className="font-mono text-xs">
                  {(ev.correlationId ?? "").trim().length > 0 ? ev.correlationId : "—"}
                </span>
              </div>
              {ev.otelTraceId ? (
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Trace</span>{" "}
                  <code title={ev.otelTraceId} className="text-xs">
                    {ev.otelTraceId.slice(0, 16)}…
                  </code>
                </div>
              ) : null}
              <div>
                <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">Payload</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-neutral-50/90 p-2 text-xs dark:bg-neutral-900/50">
                  {tryFormatDataJson(ev.dataJson)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function AuditTimelineEventCard(props: {
  ev: AuditEvent;
  buyerPolishedShell: boolean;
  uniformRunId: string | null;
}) {
  const { ev, buyerPolishedShell, uniformRunId } = props;
  const runKey = ev.runId?.trim() ?? "";
  const hideBuyerReviewLine =
    buyerPolishedShell &&
    uniformRunId !== null &&
    runKey.length > 0 &&
    uniformRunId === runKey;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{formatUtc(ev.occurredUtc)}</strong>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-300">
          {pipelineEventTypeFriendlyLabel(ev.eventType)}
        </span>
      </div>
      <div className="mt-1.5 text-sm">
        Actor: {buyerPolishedShell ? ev.actorUserName : `${ev.actorUserName} (${ev.actorUserId})`}
      </div>
      {buyerPolishedShell && !hideBuyerReviewLine ? (
        <div className="text-sm">
          Review:{" "}
          {ev.runId ? (
            <Link href={`/reviews/${ev.runId}`} title="Open review">
              {buyerFacingReviewLinkLabelFromRunId(ev.runId)}
            </Link>
          ) : (
            "—"
          )}
        </div>
      ) : null}
      {!buyerPolishedShell ? (
        <>
          <div className="text-sm">Correlation: {ev.correlationId ?? "—"}</div>
          {ev.otelTraceId ? (
            <div className="text-sm">
              Trace:{" "}
              <code title={ev.otelTraceId} className="text-xs">
                {ev.otelTraceId.slice(0, 16)}…
              </code>
            </div>
          ) : null}
          <div className="text-sm">
            Review:{" "}
            {ev.runId ? (
              <Link href={`/reviews/${ev.runId}`} title="Open review">
                {buyerFacingReviewLinkLabelFromRunId(ev.runId)}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </>
      ) : null}
      {ev.runId ? (
        buyerPolishedShell ? null : (
          <div className="mt-0.5 text-[13px]">
            <Link href={`/reviews/${ev.runId}#agent-traces`} className="text-xs">
              View agent traces →
            </Link>
          </div>
        )
      ) : null}
      {!buyerPolishedShell ? (
        <details className="mt-2.5">
          <summary className="cursor-pointer">Data JSON</summary>
          <pre className="mt-2 overflow-auto rounded-md bg-neutral-50/90 p-2 text-xs dark:bg-neutral-900/50">
            {tryFormatDataJson(ev.dataJson)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

export default function AuditPage() {
  const { currentPrincipal } = useOperatorNavAuthority();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canMutateEnterpriseShell = useEnterpriseMutationCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpen] = useState(!buyerPolishedShell);
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
      await downloadAuditExportCsv({
        fromUtcIso: new Date(fromUtc).toISOString(),
        toUtcIso: new Date(toUtc).toISOString(),
        maxRows: 10_000,
      });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setExporting(false);
    }
  }, [currentPrincipal.roleClaimValues, fromUtc, toUtc]);

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
    const eligible =
      (buyerPolishedShell || isNextPublicDemoMode()) &&
      auditEventsAreLifecycleOnlyForGrouping(displayEvents);

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

  const demoAuditSampleTimelineUi = shouldMergeOperatorDemoAlertSample();

  return (
    <main className="max-w-4xl">
      <LayerHeader pageKey="audit" />
      <OperatorPageHeader
        title="Audit log"
        helpKey="audit-log"
        actions={
          <HelpLink
            docPath="/docs/library/AUDIT_COVERAGE_MATRIX.md"
            label="Audit coverage matrix documentation on GitHub (new tab)"
          />
        }
      />
      {buyerPolishedShell ? (
        <p className="mb-3 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
          {auditSearchSectionLeadBuyerPolishedLine}
        </p>
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
        <div className={cn(buyerPolishedShell && "order-3")}>
      <section
        aria-labelledby="audit-search-heading"
        className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 mb-4 bg-white dark:bg-neutral-950"
      >
        <h3 id="audit-search-heading" className="mt-0 mb-3 text-base">
          {buyerPolishedShell
            ? auditSearchEventsSectionHeadingBuyerPolished
            : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
              ? auditSearchEventsSectionHeadingReader
              : auditSearchEventsSectionHeadingOperator}
        </h3>
        {callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority && !buyerPolishedShell ? (
          <p className="mb-2 max-w-prose text-xs text-neutral-500 dark:text-neutral-400">
            {auditSearchSectionLeadReaderLine}
          </p>
        ) : null}
        <div className="mb-3 flex flex-wrap gap-2">
          {buyerPolishedShell && demoAuditSampleTimelineUi ? (
            <>
              <button
                type="button"
                className={cn(
                  "rounded border px-2 py-1 text-xs font-medium transition-colors",
                  auditDatePreset === null && fromUtc.length === 0 && toUtc.length === 0
                    ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                )}
                disabled={searching || loadingTypes}
                onClick={() => {
                  void clearDateRangeAndSearch();
                }}
              >
                Sample review timeline
              </button>
              {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
                <button
                  type="button"
                  className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  disabled={searching}
                  onClick={() => {
                    void clearDateRangeAndSearch();
                  }}
                >
                  Reset to sample timeline
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                className={cn(
                  "rounded border px-2 py-1 text-xs font-medium transition-colors",
                  auditDatePreset === "24h"
                    ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                )}
                disabled={searching || loadingTypes}
                onClick={() => {
                  void applyAuditDatePreset("24h");
                }}
              >
                Last 24 hours
              </button>
              <button
                type="button"
                className={cn(
                  "rounded border px-2 py-1 text-xs font-medium transition-colors",
                  auditDatePreset === "7d"
                    ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                )}
                disabled={searching || loadingTypes}
                onClick={() => {
                  void applyAuditDatePreset("7d");
                }}
              >
                Last 7 days
              </button>
              {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
                <button
                  type="button"
                  className="rounded border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  disabled={searching}
                  onClick={() => {
                    void clearDateRangeAndSearch();
                  }}
                >
                  Clear date range
                </button>
              ) : null}
            </>
          )}
        </div>
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              <label>
                Event type{" "}
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  disabled={loadingTypes}
                  className="w-full mt-1"
                >
                  <option value="">Any</option>
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                From (local){" "}
                <input
                  type="datetime-local"
                  value={fromUtc}
                  onChange={(e) => setFromUtc(e.target.value)}
                  className="w-full mt-1"
                />
              </label>
              <label>
                To (local){" "}
                <input
                  type="datetime-local"
                  value={toUtc}
                  onChange={(e) => setToUtc(e.target.value)}
                  className="w-full mt-1"
                />
              </label>
              <label>
                {buyerPolishedShell ? "Linked review" : "Review ID"}{" "}
                <input
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  className="w-full mt-1"
                />
                {buyerPolishedShell && runId.trim().length > 0 ? (
                  <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
                    Showing events for <strong>{buyerFacingReviewLinkLabelFromRunId(runId)}</strong>.
                  </span>
                ) : null}
              </label>
            </div>
            <Collapsible open={advancedAuditFiltersOpen} onOpenChange={setAdvancedAuditFiltersOpen} className="mt-2">
              <CollapsibleTrigger
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-left text-xs font-medium text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              >
                Advanced filters
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", advancedAuditFiltersOpen ? "rotate-0" : "-rotate-90")}
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                  <label>
                    Correlation ID{" "}
                    <input
                      value={correlationId}
                      onChange={(e) => setCorrelationId(e.target.value)}
                      className="w-full mt-1"
                    />
                  </label>
                  <label>
                    Actor user id{" "}
                    <input
                      value={actorUserId}
                      onChange={(e) => setActorUserId(e.target.value)}
                      className="w-full mt-1"
                    />
                  </label>
                </div>
              </CollapsibleContent>
            </Collapsible>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching || loadingTypes}
            title={
              callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                ? auditSearchEventsButtonTitleReader
                : auditSearchEventsButtonTitleOperator
            }
          >
            {searching ? "Searching…" : canMutateEnterpriseShell ? "Search" : auditSearchEventsButtonLabelReaderRank}
          </button>
          <button
            type="button"
            onClick={() => void clearFiltersAndSearch()}
            disabled={searching}
            title={
              canMutateEnterpriseShell
                ? "Clear filter fields and run search with empty criteria"
                : "Clear fields and re-run search (GET only; export rules unchanged)"
            }
          >
            {canMutateEnterpriseShell ? "Clear filters" : auditClearFiltersButtonLabelReaderRank}
          </button>
        </div>
      </section>
        </div>

        <div className={cn(buyerPolishedShell && "order-1")}>
      <section aria-labelledby="audit-results-heading">
        <h3 id="audit-results-heading" className="mt-0 mb-2 text-base">
          {buyerPolishedShell
            ? auditResultsSectionHeadingBuyerPolished
            : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
              ? auditResultsSectionHeadingReader
              : auditResultsSectionHeadingOperator}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-[13px] mt-0 mb-2 max-w-2xl">
          Each card is one <GlossaryTooltip termKey="audit_event">audit event</GlossaryTooltip>
          {" — "}
          who acted, what changed, when it happened
          {buyerPolishedShell
            ? ", and which review it belongs to when one is recorded. Raw identifiers and payloads are in the technical appendix below."
            : ", and review context when present"}.
          {buyerPolishedShell ? "" : " Expand for technical payloads."}
        </p>
        <p role="status" aria-live="polite" aria-atomic="true" className="text-neutral-600 dark:text-neutral-400 text-sm mt-0">
          {formatAuditSummaryHeading(events.length, hasMoreResults)}.
          {buyerPolishedShell
            ? displayEventGroups !== null
              ? " Oldest-first pipeline order; grouped by lifecycle stage."
              : " Oldest-first lifecycle order for this view."
            : " Newest first; use Load more for older entries."}
        </p>
        {buyerPolishedShell && uniformRunIdForDisplay !== null ? (
          <p className="mb-2 mt-1 max-w-2xl text-sm text-neutral-700 dark:text-neutral-300">
            All events in this view belong to{" "}
            <Link
              className="font-medium text-teal-800 underline dark:text-teal-300"
              href={`/reviews/${encodeURIComponent(uniformRunIdForDisplay)}`}
            >
              {buyerFacingReviewLinkLabelFromRunId(uniformRunIdForDisplay)}
            </Link>
            .
          </p>
        ) : null}

        <div className="mt-3">
          {events.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400">{auditSearchEmptyLine}</p>
          ) : (
            <>
              {displayEventGroups !== null ? (
                <div className="space-y-8">
                  {displayEventGroups.map((group) => (
                    <div key={group.stage} className="space-y-3">
                      <h4 className="m-0 text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                        {group.stage}
                      </h4>
                      <div className="grid gap-3">
                        {group.events.map((ev) => (
                          <AuditTimelineEventCard
                            key={ev.eventId}
                            ev={ev}
                            buyerPolishedShell={buyerPolishedShell}
                            uniformRunId={uniformRunIdForDisplay}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayEvents.map((ev) => (
                    <AuditTimelineEventCard
                      key={ev.eventId}
                      ev={ev}
                      buyerPolishedShell={buyerPolishedShell}
                      uniformRunId={uniformRunIdForDisplay}
                    />
                  ))}
                </div>
              )}
              {buyerPolishedShell ? <BuyerAuditEventsTechnicalAppendix events={displayEvents} /> : null}
            </>
          )}
        </div>

        {events.length > 0 && hasMoreResults ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore || searching}
              title={
                callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                  ? auditLoadMoreButtonTitleReader
                  : auditLoadMoreButtonTitleOperator
              }
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>
        </div>

        <div className={cn(buyerPolishedShell && "order-2")}>
      {events.length > 0 && (!buyerPolishedShell || events.length > 0) ? (
      <section
        aria-labelledby="audit-export-heading"
        className={cn(
          "border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 mt-5 bg-neutral-50 dark:bg-neutral-950",
          !csvExportUiAllowed && "opacity-90",
        )}
      >
        <h3 id="audit-export-heading" className="mt-0 mb-2 text-base">
          {csvExportUiAllowed || buyerPolishedShell ? "Export" : "Export (restricted)"}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-xl mt-0 mb-3">
          {buyerPolishedShell ? auditExportSectionSupportingLineBuyerPolished : auditExportSectionSupportingLine}
        </p>
        <button
          type="button"
          onClick={() => void onExportCsv()}
          disabled={!csvExportUiAllowed || exporting || searching}
          title={
            !exportDateRangeReady
              ? "Set From and To to enable export"
              : !exportRoleOk
                ? auditExportControlDisabledTitle
                : "Download CSV for the current date range"
          }
        >
          {exporting
            ? "Exporting…"
            : csvExportUiAllowed
              ? "Export CSV"
              : !exportDateRangeReady
                ? auditExportCsvButtonLabelWindowIncomplete
                : !exportRoleOk
                  ? auditExportCsvButtonLabelRoleRestricted
                  : "Export CSV"}
        </button>
      </section>
      ) : null}
        </div>
      </div>
    </main>
  );
}
