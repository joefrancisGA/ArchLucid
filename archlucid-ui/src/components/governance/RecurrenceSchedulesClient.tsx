"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RecurrenceScheduleActivationActions } from "@/components/governance/RecurrenceScheduleActivationActions";
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
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  listArchitectureReviewRecurrenceSchedules,
  updateArchitectureReviewRecurrenceSchedule,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import {
  buildRecurrenceLocalTimeSummary,
  formatRecurrenceInstantLocalFirst,
  resolveRecurrenceDisplayTimeZoneId,
} from "@/lib/recurrence-local-time";
import {
  RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION,
  RECURRENCE_SCHEDULES_EMPTY_TITLE,
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY,
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
  type RecurrenceScheduleExample,
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
  const canMutate = useOperateCapability();
  const displayTimeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createSeed, setCreateSeed] = useState<RecurrenceScheduleExample | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<RecurrenceScheduleRowEditorState | null>(null);

  function openCreateFromExample(example: RecurrenceScheduleExample): void {
    if (!canMutate) {
      return;
    }

    setCreateSeed(example);
    setShowCreatePanel(true);
  }

  function closeCreatePanel(): void {
    setShowCreatePanel(false);
    setCreateSeed(null);
  }

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
    if (!canMutate) {
      return;
    }

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

  const populatedSecondaryActions = [
    { label: "View governed reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF },
    { label: "View pending approvals", href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF },
    { label: "Open risk register", href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF },
  ] as const;

  const isEmpty = schedules.length === 0;

  // Empty first viewport keeps one optional secondary link (TB-1133); populated keeps the full set.
  const secondaryActions = isEmpty
    ? ([{ label: "View governed reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF }] as const)
    : populatedSecondaryActions;

  // Open-only + hide while panel is open so Create never toggles away in-progress fields (TB-1131).
  const createScheduleButton = showCreatePanel ? null : (
    <Button
      type="button"
      size="sm"
      variant="primary"
      data-testid="recurrence-schedules-create-action"
      disabled={!canMutate}
      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
      onClick={() => {
        setCreateSeed(null);
        setShowCreatePanel(true);
      }}
    >
      Create recurrence schedule
    </Button>
  );

  return (
    <div
      className="w-full max-w-[1440px] space-y-4"
      data-testid="recurrence-schedules-page"
      data-empty-composition={isEmpty ? "true" : "false"}
    >
      <div
        className={cn(
          "grid gap-4",
          // Hide the right-rail column when empty so the page is one composition (TB-1133).
          isEmpty ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]",
        )}
      >
        <div className="space-y-4">
          <OperatorPageHeader
            title="Recurrence schedules"
            subtitle={RECURRENCE_SCHEDULES_PAGE_SUBTITLE}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <PageContextualHelpButton />
                {isEmpty ? null : createScheduleButton}
              </div>
            }
          />

          <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />
          <AdvisoryRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />

          <CollapsibleSection
            title={RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE}
            sectionTestId="recurrence-schedules-how-it-works"
          >
            <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY}
            </p>
          </CollapsibleSection>

          <nav
            aria-label="Related governance links"
            className="flex flex-wrap gap-x-4 gap-y-1"
            data-testid="recurrence-schedules-secondary-links"
          >
            {secondaryActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-400",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                {action.label}
              </Link>
            ))}
          </nav>

          {loadError ? (
            <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{loadError}</p>
          ) : null}

          {showCreatePanel ? (
            <RecurrenceScheduleCreatePanel
              key={
                createSeed === null
                  ? "create-default"
                  : `create-${createSeed.cronExpression}-${createSeed.title}`
              }
              initialName={createSeed?.title}
              initialCronExpression={createSeed?.cronExpression}
              onCreated={async () => {
                closeCreatePanel();
                await reload();
              }}
              onCancel={closeCreatePanel}
            />
          ) : null}

          {isEmpty ? (
            <>
              <EnterpriseCompactEmptyState
                testId="recurrence-schedules-empty-state"
                title={RECURRENCE_SCHEDULES_EMPTY_TITLE}
                description={RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION}
                footer={createScheduleButton}
              />
              <RecurrenceScheduleExamplesSection
                variant="compact"
                disabled={!canMutate}
                onApplyExample={openCreateFromExample}
              />
            </>
          ) : (
            <EnterpriseTable ariaLabel="Architecture review recurrence schedules">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Scope / Review</EnterpriseTableHeaderCell>
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
                          href={`/architecture/reviews/${schedule.sourceRunId}`}
                          className={cn(
                            "font-mono text-teal-800 underline-offset-2 hover:underline dark:text-teal-300",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                        >
                          {truncateRunId(schedule.sourceRunId)}
                        </Link>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <RecurrenceLocalTimeDisplay
                          summary={buildRecurrenceLocalTimeSummary({
                            cronExpression: schedule.cronExpression,
                            nextRunUtc: schedule.nextRunUtc,
                            ianaTimeZoneId: displayTimeZoneId,
                          })}
                        />
                        <p className={cn("m-0 mt-1 font-mono text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                          {schedule.cronExpression}
                        </p>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <RecurrenceLocalTimeDisplay
                          summary={formatRecurrenceInstantLocalFirst(
                            schedule.nextRunUtc,
                            displayTimeZoneId,
                          )}
                        />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <RecurrenceLocalTimeDisplay
                          summary={formatRecurrenceInstantLocalFirst(
                            schedule.lastTriggeredUtc,
                            displayTimeZoneId,
                          )}
                        />
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
                          <div className="flex min-w-[18rem] flex-col gap-3">
                            <RecurrenceScheduleFormFields
                              name={editorState.name}
                              cronExpression={editorState.cronExpression}
                              disabled={busyId === schedule.scheduleId}
                              onNameChange={(value) =>
                                setEditorState((current) => (current === null ? current : { ...current, name: value }))
                              }
                              onCronExpressionChange={(value) =>
                                setEditorState((current) =>
                                  current === null ? current : { ...current, cronExpression: value },
                                )
                              }
                            />
                            <RecurrenceScheduleActivationActions
                              mode="edit"
                              cronExpression={editorState.cronExpression}
                              pendingIsEnabled={editorState.isEnabled}
                              disabled={!canMutate}
                              busy={busyId === schedule.scheduleId}
                              onSavePaused={() => void saveEdit(schedule.scheduleId, false)}
                              onEnableRecurring={() => void saveEdit(schedule.scheduleId, true)}
                              onSaveChanges={() => void saveEdit(schedule.scheduleId, editorState.isEnabled)}
                            />
                            <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/architecture/reviews/${schedule.sourceRunId}`}>View</Link>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!canMutate}
                                title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                                onClick={() => beginEdit(schedule)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === schedule.scheduleId || !canMutate}
                                title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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

        {isEmpty ? null : <RecurrenceSchedulesWorkflowHelperCard />}
      </div>
    </div>
  );
}
