"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";

import { useAdvisoryScheduleReviewAvailability } from "@/hooks/use-advisory-schedule-review-availability";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AdvisoryScheduleCreateForm } from "@/components/advisory/AdvisoryScheduleCreateForm";
import { AdvisorySchedulesContinueLastViewedRow } from "@/components/advisory/AdvisorySchedulesContinueLastViewedRow";
import { AdvisorySchedulesNextReviewFooterClient } from "@/components/advisory/AdvisorySchedulesNextReviewFooterClient";
import { AdvisorySchedulesPickReviewBeforeSchedulingStrip } from "@/components/advisory/AdvisorySchedulesPickReviewBeforeSchedulingStrip";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
  ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS,
  ADVISORY_SCANS_SCHEDULES_LAST_LOADED_PREFIX,
  ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER,
  ADVISORY_SCANS_SCHEDULES_LIST_COUNT_LABEL,
  ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_SCAN_HISTORY,
  ADVISORY_SCANS_SCHEDULES_PAGE_HEADING,
  ADVISORY_SCANS_SCHEDULES_READ_ONLY,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL,
  ADVISORY_SCANS_SCHEDULES_RUN_NOW_NO_REVIEWS_HINT,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_SR_ONLY,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_WORKING_LABEL,
  ADVISORY_SCANS_SCHEDULES_SCAN_STARTED,
} from "@/lib/advisory-copy";
import { ADVISORY_SCHEDULES_NO_FINALIZED_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
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
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { AdvisoryScanExecution, AdvisoryScanSchedule } from "@/types/advisory-scheduling";
import {
  resolveContinueLastAdvisorySchedule,
  writeAdvisoryScheduleLastViewedId,
} from "@/lib/resolve-continue-last-advisory-schedule";

function formatAdvisorySchedulesLastLoaded(lastLoadedUtc: string | null): string {
  if (lastLoadedUtc === null) {
    return " — ";
  }

  const parsed = new Date(lastLoadedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return " — ";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Schedules tab: customer workflow for recurring advisory scans.
 * Mutations require AdminAuthority (API); sample / public shells are read-only.
 */
export type AdvisorySchedulesContentProps = {
  readonly initialRunId?: string | null;
};

export function AdvisorySchedulesContent(props: AdvisorySchedulesContentProps = {}): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const sampleModeBlocked =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canMutateSchedules =
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority && !sampleModeBlocked;
  const scopedRunId = (props.initialRunId ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.push(buildAdvisoryHubHref({ pathname, tab: "schedules", runId: trimmed }));
    },
    [pathname, router],
  );

  const schedulesClearScopeHref = buildAdvisoryHubHref({ pathname, tab: "schedules", runId: null });

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
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState("Current project");
  const [runProjectSlug, setRunProjectSlug] = useState("default");
  const [lastLoadedUtc, setLastLoadedUtc] = useState<string | null>(null);
  const [displayTimeZoneId] = useState(() => resolveBrowserTimeZoneId());
  const newestScheduleRef = useRef<HTMLTableRowElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runNowHintId = useId();
  const viewHistoryHintId = useId();
  const mutationDisabledHintId = useId();
  const runNowNoReviewsHintId = useId();
  const reviewAvailability = useAdvisoryScheduleReviewAvailability(runProjectSlug);
  const reviewsReady = !reviewAvailability.loading;
  const prerequisiteBlocksSchedules = reviewsReady && !reviewAvailability.hasFinalizedReviews;

  const syncProjectContext = useCallback(() => {
    const scope = readOperatorScopeFromStorage();
    setProjectLabel(resolveCurrentProjectLabel(scope?.projectLabel));
    setRunProjectSlug(resolveAdvisoryRunProjectSlug(scope?.projectId));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const list: AdvisoryScanSchedule[] = await listAdvisorySchedules();
      setSchedules(list);
      setLastLoadedUtc(new Date().toISOString());

      if (list.length > 0) {
        setStatusMessage("Schedules updated.");
      }
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProjectContext();

    const onScopeChanged = () => {
      syncProjectContext();
      setExecutionsBySchedule({});
      setHistoryOpenFor(null);
      void refresh();
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [refresh, syncProjectContext]);

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
  const continueLastSchedule = useMemo(
    () => resolveContinueLastAdvisorySchedule(schedules),
    [schedules],
  );

  function rememberSchedule(scheduleId: string): void {
    writeAdvisoryScheduleLastViewedId(scheduleId);
  }

  function openSchedule(scheduleId: string): void {
    rememberSchedule(scheduleId);
    document
      .querySelector(`[data-schedule-id="${scheduleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHistoryOpenFor(scheduleId);

    if (executionsBySchedule[scheduleId] === undefined) {
      void loadExecutions(scheduleId);
    }
  }

  async function onViewHistory(scheduleId: string): Promise<void> {
    rememberSchedule(scheduleId);

    if (historyOpenFor === scheduleId) {
      setHistoryOpenFor(null);

      return;
    }

    setHistoryOpenFor(scheduleId);

    if (executionsBySchedule[scheduleId] !== undefined) {
      return;
    }

    await loadExecutions(scheduleId);
  }

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
        newestScheduleRef.current = node as HTMLTableRowElement | null;
        rememberSchedule(created.scheduleId);
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

    rememberSchedule(scheduleId);
    setFailure(null);
    setRunningScheduleId(scheduleId);

    try {
      await runAdvisoryScheduleNow(scheduleId);
      await loadExecutions(scheduleId);
      await refresh();
      setStatusMessage(ADVISORY_SCANS_SCHEDULES_SCAN_STARTED);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setRunningScheduleId(null);
    }
  }

  const isEmpty = schedules.length === 0;
  const showCreateForm =
    reviewsReady &&
    (!canMutateSchedules || isEmpty || showCreatePanel) &&
    reviewAvailability.hasFinalizedReviews;
  const showHeaderCreate =
    reviewsReady &&
    canMutateSchedules &&
    !isEmpty &&
    !showCreatePanel &&
    reviewAvailability.hasFinalizedReviews;
  const showPrerequisiteEmpty = isEmpty && canMutateSchedules && prerequisiteBlocksSchedules;
  const runNowDisabledByPrerequisite = canMutateSchedules && prerequisiteBlocksSchedules;
  const listHeading = canMutateSchedules ? advisorySchedulesListHeadingOperator : advisorySchedulesListHeadingReader;
  const lastLoadedLabel = formatAdvisorySchedulesLastLoaded(lastLoadedUtc);

  const createScheduleButton =
    showHeaderCreate ? (
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

  const emptyStateFooter =
    canMutateSchedules && !prerequisiteBlocksSchedules ? (
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="advisory-schedules-create-action"
        onClick={() => {
          setShowCreatePanel(true);
          document.getElementById("advisory-schedule-create-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        Create schedule
      </Button>
    ) : null;

  const listHeader = (
    <div
      className="flex flex-wrap items-start justify-between gap-2"
      data-testid="advisory-schedules-list-header"
    >
      <div className="min-w-0 space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {listHeading}
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Project scope:</span> {projectLabel}
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-schedules-count">
            {schedules.length} {ADVISORY_SCANS_SCHEDULES_LIST_COUNT_LABEL}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-schedules-last-loaded">
            {ADVISORY_SCANS_SCHEDULES_LAST_LOADED_PREFIX}: {lastLoadedLabel}
          </span>
        </p>
      </div>
      <RefreshButton
        busy={loading}
        data-testid="advisory-schedules-refresh"
        onClick={() => void refresh()}
      />
    </div>
  );

  return (
    <OperatorPageContainer variant="workflow" className="py-4" data-testid="advisory-schedules-content">
      <div className="min-w-0 space-y-4">
        <div className="m-0 flex flex-wrap items-start justify-between gap-2">
          <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {ADVISORY_SCANS_SCHEDULES_PAGE_HEADING}
          </h2>
          {createScheduleButton}
        </div>

        <AdvisoryRecurrenceScheduleVocabularyRail
          currentSurfaceId="advisory-schedules"
          peerLinkLabel={ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL}
        />

        {!scopedRunFilterActive ? (
          <AdvisorySchedulesPickReviewBeforeSchedulingStrip selectedReviewId="" onSelectReview={onPickReview} />
        ) : (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="advisory-schedules-run-scope-banner"
          >
            {"Scheduling advisory scans for review "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={schedulesClearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
            >
              Open review
            </Link>
          </p>
        )}

        {failure !== null ? (
          <div role="alert">
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          </div>
        ) : null}

        {statusMessage !== null ? (
          <p
            className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            role="status"
            aria-live="polite"
            data-testid="advisory-schedules-status-message"
          >
            {statusMessage}
          </p>
        ) : null}

        {!canMutateSchedules && !sampleModeBlocked ? (
          <p
            className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-schedules-read-only"
          >
            {ADVISORY_SCANS_SCHEDULES_READ_ONLY}
          </p>
        ) : null}

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

        <section className="min-w-0" data-testid="advisory-schedules-existing">
          {listHeader}

          {isEmpty ? (
            <div className="mt-4">
              <EnterpriseCompactEmptyState
                {...(showPrerequisiteEmpty
                  ? ADVISORY_SCHEDULES_NO_FINALIZED_REVIEWS_EMPTY_COMPACT
                  : ADVISORY_SCHEDULES_EMPTY_COMPACT)}
                footer={showPrerequisiteEmpty ? undefined : emptyStateFooter}
              />
            </div>
          ) : (
            <div className="mt-3">
              {prerequisiteBlocksSchedules ? (
                <p
                  className={cn("m-0 mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="advisory-schedules-prerequisite-blocked"
                >
                  {ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY}
                </p>
              ) : null}
              <span id={runNowNoReviewsHintId} className="sr-only">
                {ADVISORY_SCANS_SCHEDULES_RUN_NOW_NO_REVIEWS_HINT}
              </span>
              <span id={runNowHintId} className="sr-only">
                {ADVISORY_SCANS_SCHEDULES_SCAN_NOW_SR_ONLY}
              </span>
              <span id={viewHistoryHintId} className="sr-only">
                {canMutateSchedules
                  ? advisorySchedulesLoadExecutionsButtonTitleOperator
                  : advisorySchedulesLoadExecutionsButtonTitleReader}
              </span>
              <span id={mutationDisabledHintId} className="sr-only">
                {enterpriseMutationControlDisabledTitle}
              </span>

              {continueLastSchedule !== null ? (
                <AdvisorySchedulesContinueLastViewedRow
                  target={continueLastSchedule}
                  onOpen={openSchedule}
                />
              ) : null}

              <EnterpriseTable ariaLabel="Advisory scan schedules">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Cadence</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>{ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER}</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>{ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER}</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {listViews.map((view) => (
                    <EnterpriseTableRow
                      key={view.scheduleId}
                      data-schedule-id={view.scheduleId}
                      tabIndex={-1}
                      className="outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                    >
                      <EnterpriseTableCell>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{view.name}</span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          {view.frequencyLabel}
                        </span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          {view.projectLabel}
                        </span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          {view.nextRunPrimary}
                          {view.nextRunUtcSecondary.length > 0 ? (
                            <span className="ml-2 text-neutral-500">{view.nextRunUtcSecondary}</span>
                          ) : null}
                        </span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          {view.lastRunPrimary}
                        </span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusTag kind={view.statusKind} label={view.statusLabel} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void onRunNow(view.scheduleId)}
                            disabled={
                              !canMutateSchedules || runningScheduleId !== null || runNowDisabledByPrerequisite
                            }
                            aria-describedby={
                              runNowDisabledByPrerequisite
                                ? runNowNoReviewsHintId
                                : canMutateSchedules
                                  ? runNowHintId
                                  : mutationDisabledHintId
                            }
                          >
                            {runningScheduleId === view.scheduleId
                              ? ADVISORY_SCANS_SCHEDULES_SCAN_NOW_WORKING_LABEL
                              : canMutateSchedules
                                ? ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL
                                : advisorySchedulesRunNowButtonLabelReaderRank}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void onViewHistory(view.scheduleId)}
                            aria-describedby={viewHistoryHintId}
                          >
                            {historyOpenFor === view.scheduleId
                              ? "Hide history"
                              : canMutateSchedules
                                ? "View history"
                                : advisorySchedulesLoadExecutionsButtonLabelReaderRank}
                          </Button>
                        </div>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>

              {historyOpenFor !== null && (executionsBySchedule[historyOpenFor]?.length ?? 0) > 0 ? (
                <div
                  className="mt-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                  data-testid={`advisory-schedule-history-${historyOpenFor}`}
                >
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    Recent history — {listViews.find((view) => view.scheduleId === historyOpenFor)?.name}
                  </h4>
                  <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
                    {executionsBySchedule[historyOpenFor].map((execution) => (
                      <li key={execution.executionId}>
                        {execution.status} — {new Date(execution.startedUtc).toLocaleString()}
                        {execution.errorMessage ? ` — ${execution.errorMessage}` : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {historyOpenFor !== null &&
              executionsBySchedule[historyOpenFor] !== undefined &&
              executionsBySchedule[historyOpenFor].length === 0 ? (
                <p className={cn("m-0 mt-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {ADVISORY_SCANS_SCHEDULES_NO_SCAN_HISTORY}
                </p>
              ) : null}
            </div>
          )}
        </section>
        {scopedRunFilterActive ? <AdvisorySchedulesNextReviewFooterClient runId={scopedRunId} /> : null}
      </div>
    </OperatorPageContainer>
  );
}
