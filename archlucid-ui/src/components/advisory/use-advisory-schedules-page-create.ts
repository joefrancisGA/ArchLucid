"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
  ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS,
} from "@/lib/advisory-copy";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createAdvisorySchedule } from "@/lib/api";
import { writeAdvisoryScheduleLastViewedId } from "@/lib/resolve-continue-last-advisory-schedule";
import {
  advisorySchedulesPanelsHrefFromSearch,
  parseAdvisorySchedulesCreatePanelFromSearch,
} from "@/lib/advisory/advisory-schedules-panels-url";
import type { AdvisorySchedulesPageListModel } from "@/components/advisory/use-advisory-schedules-page-list";

export type UseAdvisorySchedulesPageCreateArgs = {
  readonly list: Pick<
    AdvisorySchedulesPageListModel,
    | "canMutateSchedules"
    | "refresh"
    | "setFailure"
    | "setStatusMessage"
    | "reviewsReady"
    | "isEmpty"
    | "reviewAvailability"
    | "prerequisiteBlocksSchedules"
  >;
};

export function useAdvisorySchedulesPageCreate(args: UseAdvisorySchedulesPageCreateArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlShowCreate = parseAdvisorySchedulesCreatePanelFromSearch(searchParams.get("create"));
  const { list } = args;

  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [showCreatePanel, setShowCreatePanelState] = useState(urlShowCreate);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newestScheduleRef = useRef<HTMLTableRowElement | null>(null);

  const syncPanelsToUrl = useCallback(
    (patch: { readonly showCreatePanel?: boolean; readonly historyScheduleId?: string | null }) => {
      router.replace(advisorySchedulesPanelsHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setShowCreatePanel = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setShowCreatePanelState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        syncPanelsToUrl({ showCreatePanel: next, historyScheduleId: next ? null : undefined });

        return next;
      });
    },
    [syncPanelsToUrl],
  );

  useEffect(() => {
    setShowCreatePanelState(parseAdvisorySchedulesCreatePanelFromSearch(searchParams.get("create")));
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  async function onCreate(input: {
    readonly name: string;
    readonly cronExpression: string;
    readonly runProjectSlug: string;
  }): Promise<void> {
    if (!list.canMutateSchedules || creating) {
      return;
    }

    setCreating(true);
    setCreateSuccess(false);
    list.setFailure(null);
    list.setStatusMessage(null);

    try {
      const created = await createAdvisorySchedule({
        name: input.name,
        cronExpression: input.cronExpression,
        runProjectSlug: input.runProjectSlug,
        isEnabled: true,
      });
      await list.refresh();
      setCreateSuccess(true);
      list.setStatusMessage(ADVISORY_SCANS_SCHEDULES_CREATE_SUCCESS);
      setFormResetKey((value) => value + 1);
      setShowCreatePanel(false);

      window.setTimeout(() => {
        const node = document.querySelector(
          `[data-schedule-id="${created.scheduleId}"]`,
        ) as HTMLElement | null;
        node?.focus();
        newestScheduleRef.current = node as HTMLTableRowElement | null;
        writeAdvisoryScheduleLastViewedId(created.scheduleId);
      }, 0);

      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => setCreateSuccess(false), 4000);
    } catch (error) {
      const loadFailure = toApiLoadFailure(error);
      list.setFailure({
        ...loadFailure,
        message: loadFailure.message.trim().length > 0 ? loadFailure.message : ADVISORY_SCANS_SCHEDULES_CREATE_FAILURE,
      });
    } finally {
      setCreating(false);
    }
  }

  const showCreateForm =
    list.reviewsReady &&
    (!list.canMutateSchedules || list.isEmpty || showCreatePanel) &&
    list.reviewAvailability.hasFinalizedReviews;
  const showHeaderCreate =
    list.reviewsReady &&
    list.canMutateSchedules &&
    !list.isEmpty &&
    !showCreatePanel &&
    list.reviewAvailability.hasFinalizedReviews;
  const showPrerequisiteEmpty = list.isEmpty && list.canMutateSchedules && list.prerequisiteBlocksSchedules;

  return {
    creating,
    createSuccess,
    formResetKey,
    showCreatePanel,
    setShowCreatePanel,
    onCreate,
    showCreateForm,
    showHeaderCreate,
    showPrerequisiteEmpty,
    newestScheduleRef,
  };
}

export type AdvisorySchedulesPageCreateModel = ReturnType<typeof useAdvisorySchedulesPageCreate>;
