"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { ADVISORY_SCANS_SCHEDULES_SCAN_STARTED } from "@/lib/advisory-copy";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { listScheduleExecutions, runAdvisoryScheduleNow } from "@/lib/api";
import {
  parseAdvisorySchedulesHistoryFromSearch,
  advisorySchedulesPanelsHrefFromSearch,
} from "@/lib/advisory/advisory-schedules-panels-url";
import type { AdvisoryScanExecution } from "@/types/advisory-scheduling";
import { writeAdvisoryScheduleLastViewedId } from "@/lib/resolve-continue-last-advisory-schedule";
import type { AdvisorySchedulesPageListModel } from "@/components/advisory/use-advisory-schedules-page-list";

export type UseAdvisorySchedulesPageRunHistoryArgs = {
  readonly list: Pick<
    AdvisorySchedulesPageListModel,
    | "canMutateSchedules"
    | "refresh"
    | "setFailure"
    | "setStatusMessage"
    | "prerequisiteBlocksSchedules"
    | "executionsBySchedule"
    | "setExecutionsBySchedule"
  >;
};

export function useAdvisorySchedulesPageRunHistory(args: UseAdvisorySchedulesPageRunHistoryArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlHistoryScheduleId = parseAdvisorySchedulesHistoryFromSearch(searchParams.get("history"));
  const { list } = args;

  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [historyOpenFor, setHistoryOpenForState] = useState<string | null>(
    urlHistoryScheduleId.length > 0 ? urlHistoryScheduleId : null,
  );
  const runNowHintId = useId();
  const viewHistoryHintId = useId();
  const mutationDisabledHintId = useId();
  const runNowNoReviewsHintId = useId();

  const syncPanelsToUrl = useCallback(
    (patch: { readonly showCreatePanel?: boolean; readonly historyScheduleId?: string | null }) => {
      router.replace(advisorySchedulesPanelsHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setHistoryOpenFor = useCallback(
    (value: string | null | ((prev: string | null) => string | null)) => {
      setHistoryOpenForState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        syncPanelsToUrl({ historyScheduleId: next });

        return next;
      });
    },
    [syncPanelsToUrl],
  );

  useEffect(() => {
    const historyId = parseAdvisorySchedulesHistoryFromSearch(searchParams.get("history"));
    setHistoryOpenForState(historyId.length > 0 ? historyId : null);
  }, [searchParams]);

  async function loadExecutions(scheduleId: string): Promise<void> {
    try {
      const execs: AdvisoryScanExecution[] = await listScheduleExecutions(scheduleId, 20);
      list.setExecutionsBySchedule((prev) => ({ ...prev, [scheduleId]: execs }));
      list.setStatusMessage("History updated.");
    } catch (error) {
      list.setFailure(toApiLoadFailure(error));
    }
  }

  useEffect(() => {
    if (urlHistoryScheduleId.length === 0) {
      return;
    }

    void loadExecutions(urlHistoryScheduleId);
  }, [urlHistoryScheduleId]);

  function rememberSchedule(scheduleId: string): void {
    writeAdvisoryScheduleLastViewedId(scheduleId);
  }

  function openSchedule(scheduleId: string): void {
    rememberSchedule(scheduleId);
    document
      .querySelector(`[data-schedule-id="${scheduleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHistoryOpenFor(scheduleId);

    if (list.executionsBySchedule[scheduleId] === undefined) {
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

    if (list.executionsBySchedule[scheduleId] !== undefined) {
      return;
    }

    await loadExecutions(scheduleId);
  }

  async function onRunNow(scheduleId: string): Promise<void> {
    if (!list.canMutateSchedules || runningScheduleId !== null) {
      return;
    }

    rememberSchedule(scheduleId);
    list.setFailure(null);
    setRunningScheduleId(scheduleId);

    try {
      await runAdvisoryScheduleNow(scheduleId);
      await loadExecutions(scheduleId);
      await list.refresh();
      list.setStatusMessage(ADVISORY_SCANS_SCHEDULES_SCAN_STARTED);
    } catch (error) {
      list.setFailure(toApiLoadFailure(error));
    } finally {
      setRunningScheduleId(null);
    }
  }

  const resetHistoryOnScopeChange = useCallback(() => {
    setHistoryOpenFor(null);
  }, [setHistoryOpenFor]);

  const runNowDisabledByPrerequisite = list.canMutateSchedules && list.prerequisiteBlocksSchedules;

  return {
    runningScheduleId,
    historyOpenFor,
    setHistoryOpenFor,
    openSchedule,
    onViewHistory,
    onRunNow,
    runNowHintId,
    viewHistoryHintId,
    mutationDisabledHintId,
    runNowNoReviewsHintId,
    runNowDisabledByPrerequisite,
    resetHistoryOnScopeChange,
  };
}

export type AdvisorySchedulesPageRunHistoryModel = ReturnType<typeof useAdvisorySchedulesPageRunHistory>;
