"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { AdvisoryScheduleCreateForm } from "@/components/advisory/AdvisoryScheduleCreateForm";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { AdvisoryResultsSchedulesVocabularyRail } from "@/components/AdvisoryResultsSchedulesVocabularyRail";
import { DocumentLayout } from "@/components/DocumentLayout";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
  ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS,
  ADVISORY_SCANS_SCHEDULES_ELIGIBILITY,
  ADVISORY_SCANS_SCHEDULES_INTRO,
  ADVISORY_SCANS_SCHEDULES_PAGE_HEADING,
  ADVISORY_SCANS_SCHEDULES_READ_ONLY,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_HREF,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_HELPER,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_LABEL,
} from "@/lib/advisory-copy";
import { ADVISORY_SCHEDULES_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { resolveAdvisoryRunProjectSlug, resolveBrowserTimeZoneId } from "@/lib/advisory-schedule-form";
import {
  buildAdvisoryScheduleListItemView,
  resolveCurrentProjectLabel,
  withLatestExecutionOutcome,
} from "@/lib/advisory-schedule-page-model";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createAdvisorySchedule,
  listAdvisorySchedules,
  listScheduleExecutions,
  runAdvisoryScheduleNow,
} from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  advisorySchedulesListHeadingOperator,
  advisorySchedulesListHeadingReader,
  advisorySchedulesLoadExecutionsButtonLabelReaderRank,
  advisorySchedulesLoadExecutionsButtonTitleOperator,
  advisorySchedulesLoadExecutionsButtonTitleReader,
  advisorySchedulesRunNowButtonLabelReaderRank,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator-scope-storage";
import type { AdvisoryScanExecution, AdvisoryScanSchedule } from "@/types/advisory-scheduling";

/**
 * Schedules tab: customer workflow for recurring advisory scans.
 * Mutations require AdminAuthority (API); sample / public shells are read-only.
 */
export function AdvisorySchedulesContent(): ReactElement {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const sampleModeBlocked =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canMutateSchedules =
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority && !sampleModeBlocked;

  const [schedules, setSchedules] = useState<AdvisoryScanSchedule[]>([]);
  const [executionsBySchedule, setExecutionsBySchedule] = useState<Record<string, AdvisoryScanExecution[]>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [projectLabel, setProjectLabel] = useState("Current project");
  const [runProjectSlug, setRunProjectSlug] = useState("default");
  const [displayTimeZoneId] = useState(() => resolveBrowserTimeZoneId());
  const newestScheduleRef = useRef<HTMLLIElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncProjectContext = useCallback(() => {
    const scope = readOperatorScopeFromStorage();
    setProjectLabel(resolveCurrentProjectLabel(scope?.projectLabel));
    setRunProjectSlug(resolveAdvisoryRunProjectSlug(scope?.projectId));
  }, []);

  useEffect(() => {
    syncProjectContext();

    const onScopeChanged = () => syncProjectContext();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [syncProjectContext]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const list: AdvisoryScanSchedule[] = await listAdvisorySchedules();
      setSchedules(list);
      setStatusMessage(list.length === 0 ? null : "Schedules updated.");
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, [refresh]);

  const listViews = useMemo(
    () =>
      schedules.map((schedule) =>
        withLatestExecutionOutcome(
          buildAdvisoryScheduleListItemView(schedule, displayTimeZoneId, projectLabel),
          executionsBySchedule[schedule.scheduleId],
        ),
      ),
    [displayTimeZoneId, executionsBySchedule, projectLabel, schedules],
  );

  async function loadExecutions(scheduleId: string): Promise<void> {
    try {
      const execs: AdvisoryScanExecution[] = await listScheduleExecutions(scheduleId, 20);
      setExecutionsBySchedule((prev) => ({ ...prev, [scheduleId]: execs }));
      setStatusMessage("History updated.");
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    }
  }

  async function onCreate(input: {
    readonly name: string;
    readonly cronExpression: string;
    readonly runProjectSlug: string;
  }): Promise<void> {
    if (!canMutateSchedules || creating) {
      return;
    }

    setCreating(true);
    setCreateSuccess(false);
    setFailure(null);
    setStatusMessage(null);

    try {
      const created = await createAdvisorySchedule({
        name: input.name,
        cronExpression: input.cronExpression,
        runProjectSlug: input.runProjectSlug,
        isEnabled: true,
      });
      await refresh();
      setCreateSuccess(true);
      setStatusMessage(ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS);
      setFormResetKey((value) => value + 1);
      setShowCreatePanel(false);

      window.setTimeout(() => {
        const node = document.querySelector(
          `[data-schedule-id="${created.scheduleId}"]`,
        ) as HTMLElement | null;
        node?.focus();
        newestScheduleRef.current = node as HTMLLIElement | null;
      }, 0);

      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => setCreateSuccess(false), 4000);
    } catch (error) {
      const loadFailure = toApiLoadFailure(error);
      setFailure({
        ...loadFailure,
        message: loadFailure.message.trim().length > 0 ? loadFailure.message : ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
      });
    } finally {
      setCreating(false);
    }
  }

  async function onRunNow(scheduleId: string): Promise<void> {
    if (!canMutateSchedules || runningScheduleId !== null) {
      return;
    }

    setFailure(null);
    setRunningScheduleId(scheduleId);

    try {
      await runAdvisoryScheduleNow(scheduleId);
      await loadExecutions(scheduleId);
      await refresh();
      setStatusMessage("Schedule run started.");
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setRunningScheduleId(null);
    }
  }

  const isEmpty = schedules.length === 0;
  const showCreateForm = !canMutateSchedules || showCreatePanel;

  const createScheduleButton =
    canMutateSchedules && !showCreatePanel ? (
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="advisory-schedules-create-action"
        onClick={() => setShowCreatePanel(true)}
      >
        Create schedule
      </Button>
    ) : null;

  return (
    <div className="w-full max-w-[1200px] px-4 py-6" data-testid="advisory-schedules-content">
      <DocumentLayout>
        <div className="m-0 mb-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Advisory scans
            </p>
            <h2 className={cn("m-0 font-bold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}>
              {ADVISORY_SCANS_SCHEDULES_PAGE_HEADING}
            </h2>
          </div>
          {createScheduleButton}
        </div>
        <AdvisoryResultsSchedulesVocabularyRail currentSurfaceId="advisory-schedules" />
        <AdvisoryRecurrenceScheduleVocabularyRail currentSurfaceId="advisory-schedules" />
        <p className={cn("doc-meta m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.body)}>{ADVISORY_SCANS_SCHEDULES_INTRO}</p>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_ELIGIBILITY}
        </p>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_HELPER}{" "}
          <Link
            href={ADVISORY_SCANS_SCHEDULES_RECURRENCE_HREF}
            className="text-teal-700 underline underline-offset-2 dark:text-teal-300"
          >
            {ADVISORY_SCANS_SCHEDULES_RECURRENCE_LINK_LABEL}
          </Link>
          .
        </p>

        {failure !== null ? (
          <div className="mt-4" role="alert">
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          </div>
        ) : null}

        <div className="sr-only" aria-live="polite">
          {statusMessage}
        </div>

        {!canMutateSchedules && !sampleModeBlocked ? (
          <p
            className={cn("mt-4 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-schedules-read-only"
          >
            {ADVISORY_SCANS_SCHEDULES_READ_ONLY}
          </p>
        ) : null}

        {/* TB-1542 / TB-1477: empty-first — compact empty + header Create reveals form. */}
        <div className="mt-4 min-w-0 space-y-4" data-testid="advisory-schedules-layout">
          {showCreateForm ? (
            <AdvisoryScheduleCreateForm
              canEdit={canMutateSchedules}
              sampleModeBlocked={sampleModeBlocked}
              creating={creating}
              createSuccess={createSuccess}
              projectLabel={projectLabel}
              runProjectSlug={runProjectSlug}
              formResetKey={formResetKey}
              onCreate={onCreate}
            />
          ) : null}

          {isEmpty && !showCreatePanel ? (
            <section data-testid="advisory-schedules-existing">
              <h3 className={cn("m-0 mb-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {canMutateSchedules ? advisorySchedulesListHeadingOperator : advisorySchedulesListHeadingReader}
              </h3>
              <EnterpriseCompactEmptyState {...ADVISORY_SCHEDULES_EMPTY_COMPACT} />
            </section>
          ) : null}
        </div>

        {schedules.length > 0 ? (
        <section className="mt-4" data-testid="advisory-schedules-existing">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {canMutateSchedules ? advisorySchedulesListHeadingOperator : advisorySchedulesListHeadingReader}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
              aria-label={loading ? "Refreshing schedules" : "Refresh schedules"}
              data-testid="advisory-schedules-refresh"
            >
              <RefreshCw className={cn("mr-1.5 size-3.5", loading && "animate-spin")} aria-hidden />
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>

          <ul className="list-none space-y-3 p-0">
              {listViews.map((view) => (
                <li
                  key={view.scheduleId}
                  data-schedule-id={view.scheduleId}
                  tabIndex={-1}
                  className="rounded-lg border border-neutral-200 bg-white p-4 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong className="text-neutral-900 dark:text-neutral-100">{view.name}</strong>
                      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                        {view.frequencyLabel}
                      </p>
                    </div>
                    <StatusTag kind={view.statusKind} label={view.statusLabel} />
                  </div>
                  <dl
                    className={cn(
                      "mt-3 grid gap-2 sm:grid-cols-2 text-neutral-700 dark:text-neutral-300",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    <div>
                      <dt className="font-medium text-al-text-secondary">Project</dt>
                      <dd className="m-0">{view.projectLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-al-text-secondary">Time zone</dt>
                      <dd className="m-0">{view.timeZoneLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-al-text-secondary">Next run</dt>
                      <dd className="m-0">
                        {view.nextRunPrimary}
                        {view.nextRunUtcSecondary.length > 0 ? (
                          <span className="ml-2 text-neutral-500">{view.nextRunUtcSecondary}</span>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-al-text-secondary">Last run</dt>
                      <dd className="m-0">{view.lastRunPrimary}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-al-text-secondary">Last outcome</dt>
                      <dd className="m-0">{view.lastOutcome}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void onRunNow(view.scheduleId)}
                      disabled={!canMutateSchedules || runningScheduleId !== null}
                      title={
                        canMutateSchedules
                          ? "Run this advisory scan now without waiting for the next scheduled time."
                          : enterpriseMutationControlDisabledTitle
                      }
                    >
                      {runningScheduleId === view.scheduleId
                        ? "Running…"
                        : canMutateSchedules
                          ? "Run now"
                          : advisorySchedulesRunNowButtonLabelReaderRank}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void loadExecutions(view.scheduleId)}
                      title={
                        canMutateSchedules
                          ? advisorySchedulesLoadExecutionsButtonTitleOperator
                          : advisorySchedulesLoadExecutionsButtonTitleReader
                      }
                    >
                      {canMutateSchedules
                        ? "View history"
                        : advisorySchedulesLoadExecutionsButtonLabelReaderRank}
                    </Button>
                  </div>
                  {executionsBySchedule[view.scheduleId]?.length ? (
                    <div className="mt-3">
                      <h4
                        className={cn(
                          "mt-2 mb-2 font-semibold text-neutral-900 dark:text-neutral-100",
                          OPERATOR_TYPOGRAPHY.cardTitle,
                        )}
                      >
                        Recent history
                      </h4>
                      <ul className={cn("pl-[18px]", OPERATOR_TYPOGRAPHY.helper)}>
                        {executionsBySchedule[view.scheduleId].map((execution) => (
                          <li key={execution.executionId}>
                            {execution.status} — {new Date(execution.startedUtc).toLocaleString()}
                            {execution.errorMessage ? ` — ${execution.errorMessage}` : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
        </section>
        ) : null}
      </DocumentLayout>
    </div>
  );
}
