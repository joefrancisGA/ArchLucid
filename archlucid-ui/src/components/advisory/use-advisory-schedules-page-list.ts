"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdvisoryScheduleReviewAvailability } from "@/hooks/use-advisory-schedule-review-availability";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { resolveAdvisoryRunProjectSlug, resolveBrowserTimeZoneId } from "@/lib/advisory-schedule-form";
import {
  buildAdvisoryScheduleListItemView,
  resolveCurrentProjectLabel,
  withLatestExecutionOutcome,
} from "@/lib/advisory-schedule-page-model";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { listAdvisorySchedules } from "@/lib/api";
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
import { resolveContinueLastAdvisorySchedule } from "@/lib/resolve-continue-last-advisory-schedule";

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

export type UseAdvisorySchedulesPageListArgs = {
  readonly initialRunId?: string | null;
  readonly onOperatorScopeChanged?: () => void;
};

export function useAdvisorySchedulesPageList(args: UseAdvisorySchedulesPageListArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const sampleModeBlocked =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canMutateSchedules =
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority && !sampleModeBlocked;
  const scopedRunId = (args.initialRunId ?? "").trim();
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
  const [executionsBySchedule, setExecutionsBySchedule] = useState<Record<string, AdvisoryScanExecution[]>>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState("Current project");
  const [runProjectSlug, setRunProjectSlug] = useState("default");
  const [lastLoadedUtc, setLastLoadedUtc] = useState<string | null>(null);
  const [displayTimeZoneId] = useState(() => resolveBrowserTimeZoneId());
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
      args.onOperatorScopeChanged?.();
      void refresh();
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [args.onOperatorScopeChanged, refresh, syncProjectContext]);

  useEffect(() => {
    void refresh();
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

  const isEmpty = schedules.length === 0;
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
    setExecutionsBySchedule,
    loading,
    failure,
    setFailure,
    statusMessage,
    setStatusMessage,
    projectLabel,
    runProjectSlug,
    lastLoadedUtc,
    displayTimeZoneId,
    reviewAvailability,
    reviewsReady,
    prerequisiteBlocksSchedules,
    listViews,
    continueLastSchedule,
    isEmpty,
    listHeading,
    lastLoadedLabel,
  };
}

export type AdvisorySchedulesPageListModel = ReturnType<typeof useAdvisorySchedulesPageList>;
