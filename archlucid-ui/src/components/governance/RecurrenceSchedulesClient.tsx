"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { RecurrenceScheduleCreatePanel } from "@/components/governance/RecurrenceScheduleCreatePanel";
import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RecurrenceScheduleFormFields } from "@/components/governance/RecurrenceScheduleFormFields";
import { RecurrenceSchedulesWorkflowHelperCard } from "@/components/governance/RecurrenceSchedulesWorkflowHelperCard";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { StatusTag } from "@/components/ui/status-tag";
import {
  listArchitectureReviewRecurrenceSchedules,
  updateArchitectureReviewRecurrenceSchedule,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRecurrenceScheduleUtcLabel } from "@/lib/recurrence-schedule-utc-format";
import {
  RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION,
  RECURRENCE_SCHEDULES_EMPTY_SUPPORTING,
  RECURRENCE_SCHEDULES_EMPTY_TITLE,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
} from "@/lib/recurrence-schedules-copy";

function truncateRunId(runId: string): string {
  const normalized = runId.replace(/-/g, "");

  if (normalized.length <= 12) {
    return runId;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
}

type RecurrenceStatusPresentation = {
  kind: "ready" | "needs-attention" | "danger" | "muted";
  label: string;
  title?: string;
};

function recurrenceRunStatusPresentation(
  schedule: ArchitectureReviewRecurrenceSchedule,
): RecurrenceStatusPresentation {
  const lastStatus = schedule.lastRunStatus?.trim().toLowerCase() ?? "never";
  const failures = schedule.consecutiveFailureCount ?? 0;

  if (!schedule.isEnabled && failures >= 5) {
    return {
      kind: "danger",
      label: "Auto-disabled",
      title:
        schedule.lastErrorMessage ??
        "Auto-disabled after repeated failures — re-enable when the source run is healthy.",
    };
  }

  if (lastStatus === "failed") {
    return {
      kind: "danger",
      label: failures > 0 ? `Failed (${failures})` : "Failed",
      title: schedule.lastErrorMessage ?? undefined,
    };
  }

  if (lastStatus === "succeeded") {
    return { kind: "ready", label: "Last run OK" };
  }

  return { kind: "muted", label: "Never run" };
}

function scheduleStatusKind(
  schedule: ArchitectureReviewRecurrenceSchedule,
): "ready" | "needs-attention" {
  const runStatus = recurrenceRunStatusPresentation(schedule);

  if (runStatus.kind === "danger") {
    return "needs-attention";
  }

  if (!schedule.isEnabled) {
    return "needs-attention";
  }

  if (!schedule.nextRunUtc) {
    return "needs-attention";
  }

  const next = new Date(schedule.nextRunUtc);

  if (Number.isNaN(next.getTime())) {
    return "needs-attention";
  }

  if (next.getTime() < Date.now()) {
    return "needs-attention";
  }

  return "ready";
}

function statusTagKind(
  runStatus: RecurrenceStatusPresentation,
  statusKind: "ready" | "needs-attention",
): "ready" | "needs-attention" {
  if (runStatus.kind === "ready") {
    return "ready";
  }

  if (runStatus.kind === "danger" || runStatus.kind === "muted") {
    return "needs-attention";
  }

  return statusKind === "ready" ? "ready" : "needs-attention";
}

type RecurrenceScheduleRowEditorState = {
  name: string;
  cronExpression: string;
  isEnabled: boolean;
};

/** TB-222 — governance workspace for architecture review recurrence schedules. */
export default function RecurrenceSchedulesClient() {
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<RecurrenceScheduleRowEditorState | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listArchitectureReviewRecurrenceSchedules();
    setSchedules(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load recurrence schedules.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function toggleEnabled(schedule: ArchitectureReviewRecurrenceSchedule): Promise<void> {
    setBusyId(schedule.scheduleId);
    setLoadError(null);

    try {
      await updateArchitectureReviewRecurrenceSchedule(schedule.scheduleId, {
        isEnabled: !schedule.isEnabled,
      });

      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to update schedule.");
    } finally {
      setBusyId(null);
    }
  }

  function beginEdit(schedule: ArchitectureReviewRecurrenceSchedule): void {
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

  async function saveEdit(scheduleId: string): Promise<void> {
    if (editorState === null) {
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
        isEnabled: editorState.isEnabled,
      });

      cancelEdit();
      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to update schedule.");
    } finally {
      setBusyId(null);
    }
  }

  const secondaryActions = [
    { label: "View governed review packages", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF },
    { label: "View pending approvals", href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF },
    { label: "Open risk register", href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF },
  ] as const;

  return (
    <div className="w-full max-w-[1440px] space-y-4">
      <LayerHeader pageKey="recurrence-schedules" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <div className="space-y-4">
          <OperatorPageHeader
            title="Recurrence schedules"
            subtitle={RECURRENCE_SCHEDULES_PAGE_SUBTITLE}
            actions={
              <Button
                type="button"
                size="sm"
                data-testid="recurrence-schedules-create-action"
                onClick={() => setShowCreatePanel((open) => !open)}
              >
                Create recurrence schedule
              </Button>
            }
          />

          <div className="flex flex-wrap gap-2">
            {secondaryActions.map((action) => (
              <Button key={action.href} asChild size="sm" variant="outline">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>

          {loadError ? (
            <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{loadError}</p>
          ) : null}

          {showCreatePanel ? (
            <RecurrenceScheduleCreatePanel
              onCreated={async () => {
                setShowCreatePanel(false);
                await reload();
              }}
              onCancel={() => setShowCreatePanel(false)}
            />
          ) : null}

          {schedules.length === 0 ? (
            <>
              <EnterpriseCompactEmptyState
                testId="recurrence-schedules-empty-state"
                title={RECURRENCE_SCHEDULES_EMPTY_TITLE}
                description={`${RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION} ${RECURRENCE_SCHEDULES_EMPTY_SUPPORTING}`}
                actions={[
                  {
                    label: "View governed review packages",
                    href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
                    variant: "primary",
                  },
                  {
                    label: "View pending approvals",
                    href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
                    variant: "outline",
                  },
                ]}
                footer={
                  <Button
                    type="button"
                    size="sm"
                    data-testid="recurrence-schedules-empty-create"
                    onClick={() => setShowCreatePanel(true)}
                  >
                    Create recurrence schedule
                  </Button>
                }
              />
              <RecurrenceScheduleExamplesSection />
            </>
          ) : (
            <EnterpriseTable ariaLabel="Architecture review recurrence schedules">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Scope / Review package</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Cadence</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Next run</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Last run</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Enabled</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {schedules.map((schedule) => {
                  const statusKind = scheduleStatusKind(schedule);
                  const runStatus = recurrenceRunStatusPresentation(schedule);
                  const autoDisabled = !schedule.isEnabled && (schedule.consecutiveFailureCount ?? 0) >= 5;
                  const isEditing = editingId === schedule.scheduleId;

                  return (
                    <EnterpriseTableRow key={schedule.scheduleId}>
                      <EnterpriseTableCell>{schedule.name}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <Link
                          href={`/reviews/${schedule.sourceRunId}`}
                          className={cn(
                            "font-mono text-teal-800 underline-offset-2 hover:underline dark:text-teal-300",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                        >
                          {truncateRunId(schedule.sourceRunId)}
                        </Link>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                        {schedule.cronExpression}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>{formatRecurrenceScheduleUtcLabel(schedule.nextRunUtc)}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {formatRecurrenceScheduleUtcLabel(schedule.lastTriggeredUtc)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusTag
                          kind={statusTagKind(runStatus, statusKind)}
                          label={runStatus.label}
                          title={runStatus.title}
                        />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <BooleanStatusChip
                          value={schedule.isEnabled}
                          trueLabel="Enabled"
                          falseLabel="Disabled"
                          data-testid={`recurrence-enabled-${schedule.scheduleId}`}
                        />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {isEditing && editorState !== null ? (
                          <form
                            className="flex min-w-[18rem] flex-col gap-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void saveEdit(schedule.scheduleId);
                            }}
                          >
                            <RecurrenceScheduleFormFields
                              name={editorState.name}
                              cronExpression={editorState.cronExpression}
                              isEnabled={editorState.isEnabled}
                              disabled={busyId === schedule.scheduleId}
                              onNameChange={(value) =>
                                setEditorState((current) => (current === null ? current : { ...current, name: value }))
                              }
                              onCronExpressionChange={(value) =>
                                setEditorState((current) =>
                                  current === null ? current : { ...current, cronExpression: value },
                                )
                              }
                              onIsEnabledChange={(value) =>
                                setEditorState((current) =>
                                  current === null ? current : { ...current, isEnabled: value },
                                )
                              }
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button type="submit" size="sm" disabled={busyId === schedule.scheduleId}>
                                Save
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/reviews/${schedule.sourceRunId}`}>View</Link>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => beginEdit(schedule)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === schedule.scheduleId}
                                onClick={() => void toggleEnabled(schedule)}
                                data-testid={`recurrence-toggle-${schedule.scheduleId}`}
                              >
                                {busyId === schedule.scheduleId
                                  ? "Saving…"
                                  : schedule.isEnabled
                                    ? "Disable"
                                    : "Enable"}
                              </Button>
                            </div>
                            {autoDisabled ? (
                              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                                Auto-disabled after repeated failures — re-enable when ready.
                              </span>
                            ) : null}
                          </div>
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
        </div>

        <RecurrenceSchedulesWorkflowHelperCard />
      </div>
    </div>
  );
}
