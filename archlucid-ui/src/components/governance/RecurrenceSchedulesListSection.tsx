"use client";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { RecurrenceSchedulesContinueLastViewedRow } from "@/components/governance/RecurrenceSchedulesContinueLastViewedRow";
import { RecurrenceScheduleCreatePanel } from "@/components/governance/RecurrenceScheduleCreatePanel";
import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RecurrenceScheduleWorkspaceActiveReviewStrip } from "@/components/governance/RecurrenceScheduleWorkspaceActiveReviewStrip";
import { RecurrenceSchedulesTable } from "@/components/governance/RecurrenceSchedulesTable";
import {
  RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION,
  RECURRENCE_SCHEDULES_EMPTY_TITLE,
} from "@/lib/recurrence-schedules-copy";

import type { UseRecurrenceSchedulesClientResult } from "./use-recurrence-schedules-client";

type Props = Pick<
  UseRecurrenceSchedulesClientResult,
  | "scopedRunFilterActive"
  | "isEmpty"
  | "showCreatePanel"
  | "createSeed"
  | "createSourceRunId"
  | "recurrenceWorkflowSteps"
  | "recurrenceWorkflowEmphasizedStepId"
  | "canMutate"
  | "closeCreatePanel"
  | "reload"
  | "openCreateFromWorkspaceActive"
  | "openCreateFromExample"
  | "continueLastSchedule"
  | "openSchedule"
  | "schedules"
  | "displayTimeZoneId"
  | "editingId"
  | "editorState"
  | "busyId"
  | "mutationDisabledReason"
  | "mutationDisabledHintId"
  | "rememberSchedule"
  | "toggleEnabled"
  | "beginEdit"
  | "cancelEdit"
  | "setEditorState"
  | "saveEdit"
> & {
  readonly createScheduleButton: React.ReactNode;
};

export function RecurrenceSchedulesListSection({
  scopedRunFilterActive,
  isEmpty,
  showCreatePanel,
  createSeed,
  createSourceRunId,
  recurrenceWorkflowSteps,
  recurrenceWorkflowEmphasizedStepId,
  canMutate,
  closeCreatePanel,
  reload,
  openCreateFromWorkspaceActive,
  openCreateFromExample,
  continueLastSchedule,
  openSchedule,
  schedules,
  displayTimeZoneId,
  editingId,
  editorState,
  busyId,
  mutationDisabledReason,
  mutationDisabledHintId,
  rememberSchedule,
  toggleEnabled,
  beginEdit,
  cancelEdit,
  setEditorState,
  saveEdit,
  createScheduleButton,
}: Props) {
  if (!scopedRunFilterActive) {
    return null;
  }

  return (
    <>
      <IntegrationConnectChecklist
        title="Recurrence checklist"
        steps={recurrenceWorkflowSteps}
        emphasizedStepId={recurrenceWorkflowEmphasizedStepId}
        testIdPrefix="recurrence-schedules"
      />

      {showCreatePanel ? (
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

      {isEmpty && !showCreatePanel ? (
        <RecurrenceScheduleWorkspaceActiveReviewStrip onScheduleFromWorkspaceActive={openCreateFromWorkspaceActive} />
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
      )}
    </>
  );
}
