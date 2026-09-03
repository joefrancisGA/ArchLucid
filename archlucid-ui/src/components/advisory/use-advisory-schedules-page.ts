"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useAdvisoryScheduleReviewAvailability } from "@/hooks/use-advisory-schedule-review-availability";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
  ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS,
  ADVISORY_SCANS_SCHEDULES_SCAN_STARTED,
} from "@/lib/advisory-copy";
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

export type AdvisorySchedulesPageState = ReturnType<typeof useAdvisorySchedulesPage>;

export function useAdvisorySchedulesPage(initialRunId?: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const sampleModeBlocked =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canMutateSchedules =
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority && !sampleModeBlocked;
  const scopedRunId = (initialRunId ?? "").trim();
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


  return {
    router,
    pathname,
    callerAuthorityRank,
    sampleModeBlocked,
    canMutateSchedules,
    scopedRunId,
    scopedRunFilterActive,
    onPickReview,
    schedulesClearScopeHref,
    refresh,
    schedules,
    executionsBySchedule,
    loading,
    creating,
    createSuccess,
    runningScheduleId,
    failure,
    statusMessage,
    formResetKey,
    showCreatePanel,
    historyOpenFor,
    projectLabel,
    runProjectSlug,
    lastLoadedUtc,
    displayTimeZoneId,
    reviewAvailability,
    reviewsReady,
    prerequisiteBlocksSchedules,
    listViews,
    continueLastSchedule,
    openSchedule,
    onViewHistory,
    onCreate,
    onRunNow,
    isEmpty,
    showCreateForm,
    showHeaderCreate,
    showPrerequisiteEmpty,
    runNowDisabledByPrerequisite,
    listHeading,
    lastLoadedLabel,
    runNowHintId,
    viewHistoryHintId,
    mutationDisabledHintId,
    runNowNoReviewsHintId,
    setShowCreatePanel,
  };
}
