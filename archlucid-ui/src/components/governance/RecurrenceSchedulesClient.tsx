"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  GOVERNANCE_RECURRENCE_SCHEDULES_PATH,
  recurrenceSchedulesHref,
} from "@/lib/governance/recurrence-schedules-route";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { RecurrenceSchedulesPickReviewBeforeSchedulingStrip } from "@/components/governance/RecurrenceSchedulesPickReviewBeforeSchedulingStrip";
import { RecurrenceSchedulesNextReviewFooterClient } from "@/components/governance/RecurrenceSchedulesNextReviewFooterClient";
import { RecurrenceSchedulesContinueLastViewedRow } from "@/components/governance/RecurrenceSchedulesContinueLastViewedRow";
import { RecurrenceScheduleCreatePanel } from "@/components/governance/RecurrenceScheduleCreatePanel";
import { RecurrenceScheduleWorkspaceActiveReviewStrip } from "@/components/governance/RecurrenceScheduleWorkspaceActiveReviewStrip";
import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RecurrenceSchedulesWorkflowHelperCard } from "@/components/governance/RecurrenceSchedulesWorkflowHelperCard";
import { RecurrenceSchedulesTable, type RecurrenceScheduleRowEditorState } from "@/components/governance/RecurrenceSchedulesTable";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  listArchitectureReviewRecurrenceSchedules,
  updateArchitectureReviewRecurrenceSchedule,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import {
  resolveContinueLastRecurrenceSchedule,
  writeRecurrenceScheduleLastViewedId,
} from "@/lib/resolve-continue-last-recurrence-schedule";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { resolveRecurrenceDisplayTimeZoneId } from "@/lib/recurrence-local-time";
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
import { recurrenceSchedulesLoadFailureMessage } from "@/components/governance/recurrence-schedules-presentation";

/** TB-222 — governance workspace for architecture review recurrence schedules. */
export default function RecurrenceSchedulesClient() {
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

  const populatedSecondaryActions = [
    { label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF },
    { label: "View pending approvals", href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF },
    { label: "Open risk register", href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF },
  ] as const;

  const isEmpty = schedules.length === 0;
  const continueLastSchedule = useMemo(
    () => resolveContinueLastRecurrenceSchedule(schedules),
    [schedules],
  );
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "recurrence-schedules-mutate-disabled-hint";

  // Empty first viewport keeps one optional secondary link (TB-1133); populated keeps the full set.
  const secondaryActions = isEmpty
    ? ([{ label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF }] as const)
    : populatedSecondaryActions;

  // Open-only + hide while panel is open so Create never toggles away in-progress fields (TB-1131).
  const createScheduleButton =
    showCreatePanel || !scopedRunFilterActive
      ? null
      : (
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
    <OperatorPageContainer
      variant="dashboard"
      className="space-y-4"
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

          {!scopedRunFilterActive ? (
            <RecurrenceSchedulesPickReviewBeforeSchedulingStrip
              selectedReviewId=""
              onSelectReview={onPickReviewForScheduling}
            />
          ) : (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="recurrence-schedules-run-scope-banner"
            >
              {"Scheduling recurrences for review "}
              <span className="font-mono text-al-text-primary">{scopedRunId}</span>
              {" · "}
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={recurrenceSchedulesHref()}>
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

          {scopedRunFilterActive && showCreatePanel ? (
            <RecurrenceScheduleCreatePanel
              key={
                createSeed === null
                  ? createSourceRunId === undefined
                    ? "create-default"
                    : `create-workspace-${createSourceRunId}`
                  : `create-${createSeed.cronExpression}-${createSeed.title}`
              }
              initialName={createSeed?.title}
              initialCronExpression={createSeed?.cronExpression}
              initialSourceRunId={createSourceRunId}
              onCreated={async () => {
                closeCreatePanel();
                await reload();
              }}
              onCancel={closeCreatePanel}
            />
          ) : null}

          {scopedRunFilterActive && isEmpty && !showCreatePanel ? (
            <RecurrenceScheduleWorkspaceActiveReviewStrip onScheduleFromWorkspaceActive={openCreateFromWorkspaceActive} />
          ) : null}

          {scopedRunFilterActive && isEmpty ? (
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
          ) : scopedRunFilterActive ? (
            <>
            {continueLastSchedule !== null ? (
              <RecurrenceSchedulesContinueLastViewedRow
                target={continueLastSchedule}
                onOpen={openSchedule}
              />
            ) : null}
            <RecurrenceSchedulesTable
              schedules={schedules}
              displayTimeZoneId={displayTimeZoneId}
              editingId={editingId}
              editorState={editorState}
              busyId={busyId}
              canMutate={canMutate}
              mutationDisabledReason={mutationDisabledReason}
              mutationDisabledHintId={mutationDisabledHintId}
              onRememberSchedule={rememberSchedule}
              onToggleEnabled={(schedule) => {
                void toggleEnabled(schedule);
              }}
              onBeginEdit={beginEdit}
              onCancelEdit={cancelEdit}
              onEditorNameChange={(value) =>
                setEditorState((current) => (current === null ? current : { ...current, name: value }))
              }
              onEditorCronExpressionChange={(value) =>
                setEditorState((current) =>
                  current === null ? current : { ...current, cronExpression: value },
                )
              }
              onSavePaused={(scheduleId) => {
                void saveEdit(scheduleId, false);
              }}
              onEnableRecurring={(scheduleId) => {
                void saveEdit(scheduleId, true);
              }}
              onSaveChanges={(scheduleId, isEnabled) => {
                void saveEdit(scheduleId, isEnabled);
              }}
            />
            </>
          ) : null}
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

          rememberSchedule(pendingDisable.scheduleId);
          void executeToggleEnabled(pendingDisable, false)
            .then(() => {
              setPendingDisable(null);
            })
            .catch(() => {
              // Load error already surfaced.
            });
        }}
      />

      {scopedRunFilterActive ? <RecurrenceSchedulesNextReviewFooterClient runId={scopedRunId} /> : null}
    </OperatorPageContainer>
  );
}
