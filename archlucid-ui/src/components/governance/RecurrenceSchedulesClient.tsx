"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
const GOVERNANCE_RECURRENCE_SCHEDULES_PATH = "/governance/recurrence-schedules" as const;
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OperatorInventoryRowMoreActions } from "@/components/operator/OperatorInventoryRowMoreActions";
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
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reversibleControlLabel, reversibleControlStateLabel } from "@/lib/reversible-control-verbs";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
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

const RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL = "Open review";

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

function recurrenceSchedulesLoadFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load recurrence schedules.";
}

/** TB-222 — governance workspace for architecture review recurrence schedules. */
export default function RecurrenceSchedulesClient() {
  const canMutate = useOperateCapability();
  const displayTimeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingLoad, setRetryingLoad] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createSeed, setCreateSeed] = useState<RecurrenceScheduleExample | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<RecurrenceScheduleRowEditorState | null>(null);
  const [pendingDisable, setPendingDisable] = useState<ArchitectureReviewRecurrenceSchedule | null>(null);

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
    { label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF },
    { label: "View pending approvals", href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF },
    { label: "Open risk register", href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF },
  ] as const;

  const isEmpty = schedules.length === 0;
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "recurrence-schedules-mutate-disabled-hint";

  // Empty first viewport keeps one optional secondary link (TB-1133); populated keeps the full set.
  const secondaryActions = isEmpty
    ? ([{ label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF }] as const)
    : populatedSecondaryActions;

  // Open-only + hide while panel is open so Create never toggles away in-progress fields (TB-1131).
  const createScheduleButton = showCreatePanel ? null : (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="recurrence-schedules-create-action"
        disabled={!canMutate}
        aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
        onClick={() => {
          setCreateSeed(null);
          setShowCreatePanel(true);
        }}
      >
        Create recurrence schedule
      </Button>
      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId="recurrence-schedules-mutate-disabled-hint"
      />
    </div>
  );

  return (
    <div
      className="w-full max-w-[1440px] space-y-4"
      data-testid="recurrence-schedules-page"
      data-empty-composition={isEmpty ? "true" : "false"}
    >
      <div className="space-y-4">
          <OperatorPageHeader
            navHref={GOVERNANCE_RECURRENCE_SCHEDULES_PATH}
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

          {/* TB-1573: teaching helper is collapsed disclosure only — never a persistent rail. */}
          {isEmpty ? null : <RecurrenceSchedulesWorkflowHelperCard />}

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
            <OperatorSectionLoadFailure
              message={loadError}
              retrying={retryingLoad}
              testId="recurrence-schedules-load-failure"
              onRetry={() => void retryLoad()}
            />
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
                  <EnterpriseTableHeaderCell>Recurrence</EnterpriseTableHeaderCell>
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
                            OPERATOR_BODY_INLINE_LINK_CLASS,
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                          title={`Architecture review ${truncateRunId(schedule.sourceRunId)}`}
                        >
                          {RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL}
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
                        <details className="mt-1">
                          <summary className={cn("cursor-pointer text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                            Cron expression
                          </summary>
                          <p className={cn("m-0 mt-1 font-mono text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                            {schedule.cronExpression}
                          </p>
                        </details>
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
                          trueLabel={reversibleControlStateLabel("recurring-activity", true)}
                          falseLabel={reversibleControlStateLabel("recurring-activity", false)}
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
                          <OperatorInventoryRowMoreActions
                            testId={`recurrence-more-${schedule.scheduleId}`}
                            primaryActions={
                              <>
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/architecture/reviews/${schedule.sourceRunId}`}>View</Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === schedule.scheduleId || !canMutate}
                                  aria-describedby={
                                    mutationDisabledReason === null ? undefined : mutationDisabledHintId
                                  }
                                  onClick={() => void toggleEnabled(schedule)}
                                  data-testid={`recurrence-toggle-${schedule.scheduleId}`}
                                >
                                  {busyId === schedule.scheduleId
                                    ? "Saving…"
                                    : reversibleControlLabel("recurring-activity", schedule.isEnabled)}
                                </Button>
                              </>
                            }
                            overflowActions={
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!canMutate}
                                aria-describedby={
                                  mutationDisabledReason === null ? undefined : mutationDisabledHintId
                                }
                                onClick={() => beginEdit(schedule)}
                              >
                                Edit
                              </Button>
                            }
                          />
                        )}
                        {!isEditing && autoDisabled ? (
                          <span className={cn("mt-2 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                            Auto-disabled after repeated failures — re-enable when ready.
                          </span>
                        ) : null}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
      </div>

      <ConfirmationDialog
        open={pendingDisable !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDisable(null);
          }
        }}
        title="Disable recurrence schedule?"
        description={
          pendingDisable !== null
            ? `Disable “${pendingDisable.name}”? ArchLucid will stop creating scheduled architecture reviews from this schedule until you enable it again.`
            : "ArchLucid will stop creating scheduled architecture reviews from this schedule until you enable it again."
        }
        confirmLabel="Disable schedule"
        variant="destructive"
        busy={pendingDisable !== null && busyId === pendingDisable.scheduleId}
        onConfirm={() => {
          if (pendingDisable === null) {
            return;
          }

          void executeToggleEnabled(pendingDisable, false)
            .then(() => {
              setPendingDisable(null);
            })
            .catch(() => {
              // Load error already surfaced.
            });
        }}
      />
    </div>
  );
}
