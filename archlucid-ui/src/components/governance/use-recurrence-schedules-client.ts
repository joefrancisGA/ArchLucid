"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  listArchitectureReviewRecurrenceSchedules,
  updateArchitectureReviewRecurrenceSchedule,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import {
  GOVERNANCE_RECURRENCE_SCHEDULES_PATH,
} from "@/lib/governance/recurrence-schedules-route";
import {
  resolveContinueLastRecurrenceSchedule,
  writeRecurrenceScheduleLastViewedId,
} from "@/lib/resolve-continue-last-recurrence-schedule";
import { resolveRecurrenceDisplayTimeZoneId } from "@/lib/recurrence-local-time";
import type { RecurrenceScheduleExample } from "@/lib/recurrence-schedules-copy";
import { recurrenceSchedulesLoadFailureMessage } from "@/components/governance/recurrence-schedules-presentation";
import {
  resolveRecurrenceSchedulesWorkflowEmphasizedStepId,
  resolveRecurrenceSchedulesWorkflowSteps,
} from "@/lib/recurrence-schedules-workflow-checklist";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";

import type { RecurrenceScheduleRowEditorState } from "./RecurrenceSchedulesTable";

export type UseRecurrenceSchedulesClientResult = {
  readonly scopedRunId: string;
  readonly scopedRunFilterActive: boolean;
  readonly canMutate: boolean;
  readonly displayTimeZoneId: string;
  readonly schedules: ArchitectureReviewRecurrenceSchedule[];
  readonly scopedSchedules: ArchitectureReviewRecurrenceSchedule[];
  readonly loadError: string | null;
  readonly retryingLoad: boolean;
  readonly busyId: string | null;
  readonly showCreatePanel: boolean;
  readonly createSeed: RecurrenceScheduleExample | null;
  readonly createSourceRunId: string | undefined;
  readonly editingId: string | null;
  readonly editorState: RecurrenceScheduleRowEditorState | null;
  readonly pendingDisable: ArchitectureReviewRecurrenceSchedule | null;
  readonly isEmpty: boolean;
  readonly recurrenceWorkflowSteps: ReturnType<typeof resolveRecurrenceSchedulesWorkflowSteps>;
  readonly recurrenceWorkflowEmphasizedStepId: ReturnType<typeof resolveRecurrenceSchedulesWorkflowEmphasizedStepId>;
  readonly continueLastSchedule: ReturnType<typeof resolveContinueLastRecurrenceSchedule>;
  readonly mutationDisabledReason: ReturnType<typeof whyDisabledEnterpriseMutationControl>;
  readonly mutationDisabledHintId: string;
  readonly onPickReviewForScheduling: (reviewId: string) => void;
  readonly openCreateFromExample: (example: RecurrenceScheduleExample) => void;
  readonly openCreateFromWorkspaceActive: (runId: string) => void;
  readonly closeCreatePanel: () => void;
  readonly retryLoad: () => Promise<void>;
  readonly reload: () => Promise<void>;
  readonly rememberSchedule: (scheduleId: string) => void;
  readonly openSchedule: (scheduleId: string) => void;
  readonly beginEdit: (schedule: ArchitectureReviewRecurrenceSchedule) => void;
  readonly cancelEdit: () => void;
  readonly toggleEnabled: (schedule: ArchitectureReviewRecurrenceSchedule) => Promise<void>;
  readonly executeToggleEnabled: (
    schedule: ArchitectureReviewRecurrenceSchedule,
    nextEnabled: boolean,
  ) => Promise<void>;
  readonly saveEdit: (scheduleId: string, isEnabled: boolean) => Promise<void>;
  readonly setPendingDisable: React.Dispatch<React.SetStateAction<ArchitectureReviewRecurrenceSchedule | null>>;
  readonly setShowCreatePanel: React.Dispatch<React.SetStateAction<boolean>>;
  readonly setCreateSeed: React.Dispatch<React.SetStateAction<RecurrenceScheduleExample | null>>;
  readonly setEditorState: React.Dispatch<React.SetStateAction<RecurrenceScheduleRowEditorState | null>>;
};

export function useRecurrenceSchedulesClient(): UseRecurrenceSchedulesClientResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForScheduling = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_RECURRENCE_SCHEDULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canMutate = useOperateCapability();
  const displayTimeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingLoad, setRetryingLoad] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createSeed, setCreateSeed] = useState<RecurrenceScheduleExample | null>(null);
  const [createSourceRunId, setCreateSourceRunId] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<RecurrenceScheduleRowEditorState | null>(null);
  const [pendingDisable, setPendingDisable] = useState<ArchitectureReviewRecurrenceSchedule | null>(null);

  function openCreateFromExample(example: RecurrenceScheduleExample): void {
    if (!canMutate) {
      return;
    }

    setCreateSeed(example);
    setCreateSourceRunId(undefined);
    setShowCreatePanel(true);
  }

  function openCreateFromWorkspaceActive(runId: string): void {
    if (!canMutate) {
      return;
    }

    setCreateSeed(null);
    setCreateSourceRunId(runId);
    setShowCreatePanel(true);
  }

  function closeCreatePanel(): void {
    setShowCreatePanel(false);
    setCreateSeed(null);
    setCreateSourceRunId(undefined);
  }

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listArchitectureReviewRecurrenceSchedules();
    setSchedules(rows);
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!canceled) {
          setLoadError(recurrenceSchedulesLoadFailureMessage(error));
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [reload]);

  /** `reload` throws rather than reporting, so the retry path owns the message the same way the effect does. */
  const retryLoad = useCallback(async (): Promise<void> => {
    setRetryingLoad(true);
    setLoadError(null);

    try {
      await reload();
    } catch (error: unknown) {
      setLoadError(recurrenceSchedulesLoadFailureMessage(error));
    } finally {
      setRetryingLoad(false);
    }
  }, [reload]);

  async function toggleEnabled(schedule: ArchitectureReviewRecurrenceSchedule): Promise<void> {
    if (!canMutate) {
      return;
    }

    if (schedule.isEnabled) {
      setPendingDisable(schedule);

      return;
    }

    rememberSchedule(schedule.scheduleId);
    await executeToggleEnabled(schedule, true);
  }

  async function executeToggleEnabled(
    schedule: ArchitectureReviewRecurrenceSchedule,
    nextEnabled: boolean,
  ): Promise<void> {
    setBusyId(schedule.scheduleId);
    setLoadError(null);

    try {
      await updateArchitectureReviewRecurrenceSchedule(schedule.scheduleId, {
        isEnabled: nextEnabled,
      });

      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to update schedule.");
      throw error;
    } finally {
      setBusyId(null);
    }
  }

  function rememberSchedule(scheduleId: string): void {
    writeRecurrenceScheduleLastViewedId(scheduleId);
  }

  function openSchedule(scheduleId: string): void {
    rememberSchedule(scheduleId);
    const match = schedules.find((schedule) => schedule.scheduleId === scheduleId);

    if (match !== undefined) {
      beginEdit(match);
    }

    document
      .querySelector(`[data-recurrence-schedule-id="${scheduleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function beginEdit(schedule: ArchitectureReviewRecurrenceSchedule): void {
    rememberSchedule(schedule.scheduleId);
    setEditingId(schedule.scheduleId);
    setEditorState({
      name: schedule.name,
      cronExpression: schedule.cronExpression,
      isEnabled: schedule.isEnabled,
    });
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditorState(null);
  }

  async function saveEdit(scheduleId: string, isEnabled: boolean): Promise<void> {
    if (!canMutate || editorState === null) {
      return;
    }

    if (editorState.name.trim().length === 0) {
      setLoadError("Schedule name is required.");

      return;
    }

    setBusyId(scheduleId);
    setLoadError(null);

    try {
      await updateArchitectureReviewRecurrenceSchedule(scheduleId, {
        name: editorState.name.trim(),
        cronExpression: editorState.cronExpression.trim(),
        isEnabled,
      });

      cancelEdit();
      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to update schedule.");
    } finally {
      setBusyId(null);
    }
  }

  const isEmpty = schedules.length === 0;
  const scopedSchedules = useMemo(
    () =>
      scopedRunFilterActive
        ? schedules.filter((schedule) => schedule.sourceRunId.trim() === scopedRunId)
        : schedules,
    [scopedRunFilterActive, scopedRunId, schedules],
  );
  const recurrenceWorkflowSteps = resolveRecurrenceSchedulesWorkflowSteps({
    reviewPicked: scopedRunFilterActive,
    scheduleConfigured: scopedSchedules.length > 0 || showCreatePanel,
    scheduleEnabled: scopedSchedules.some((schedule) => schedule.isEnabled),
  });
  const recurrenceWorkflowEmphasizedStepId = resolveRecurrenceSchedulesWorkflowEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    scheduleConfigured: scopedSchedules.length > 0 || showCreatePanel,
    scheduleEnabled: scopedSchedules.some((schedule) => schedule.isEnabled),
  });
  const continueLastSchedule = useMemo(
    () => resolveContinueLastRecurrenceSchedule(schedules),
    [schedules],
  );
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "recurrence-schedules-mutate-disabled-hint";

  return {
    scopedRunId,
    scopedRunFilterActive,
    canMutate,
    displayTimeZoneId,
    schedules,
    scopedSchedules,
    loadError,
    retryingLoad,
    busyId,
    showCreatePanel,
    createSeed,
    createSourceRunId,
    editingId,
    editorState,
    pendingDisable,
    isEmpty,
    recurrenceWorkflowSteps,
    recurrenceWorkflowEmphasizedStepId,
    continueLastSchedule,
    mutationDisabledReason,
    mutationDisabledHintId,
    onPickReviewForScheduling,
    openCreateFromExample,
    openCreateFromWorkspaceActive,
    closeCreatePanel,
    retryLoad,
    reload,
    rememberSchedule,
    openSchedule,
    beginEdit,
    cancelEdit,
    toggleEnabled,
    executeToggleEnabled,
    saveEdit,
    setPendingDisable,
    setShowCreatePanel,
    setCreateSeed,
    setEditorState,
  };
}
