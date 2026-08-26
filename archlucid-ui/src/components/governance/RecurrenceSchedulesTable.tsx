"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { RecurrenceScheduleActivationActions } from "@/components/governance/RecurrenceScheduleActivationActions";
import { RecurrenceScheduleFormFields } from "@/components/governance/RecurrenceScheduleFormFields";
import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import { OperatorInventoryRowMoreActions } from "@/components/operator/OperatorInventoryRowMoreActions";
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
import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildRecurrenceLocalTimeSummary,
  formatRecurrenceInstantLocalFirst,
} from "@/lib/recurrence-local-time";
import { reversibleControlLabel, reversibleControlStateLabel } from "@/lib/reversible-control-verbs";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

import {
  RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL,
  recurrenceRunStatusPresentation,
  scheduleStatusKind,
  statusTagKind,
  truncateRunId,
} from "./recurrence-schedules-presentation";

export type RecurrenceScheduleRowEditorState = {
  name: string;
  cronExpression: string;
  isEnabled: boolean;
};

export type RecurrenceSchedulesTableProps = {
  readonly schedules: readonly ArchitectureReviewRecurrenceSchedule[];
  readonly displayTimeZoneId: string;
  readonly editingId: string | null;
  readonly editorState: RecurrenceScheduleRowEditorState | null;
  readonly busyId: string | null;
  readonly canMutate: boolean;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly mutationDisabledHintId: string;
  readonly onRememberSchedule: (scheduleId: string) => void;
  readonly onToggleEnabled: (schedule: ArchitectureReviewRecurrenceSchedule) => void;
  readonly onBeginEdit: (schedule: ArchitectureReviewRecurrenceSchedule) => void;
  readonly onCancelEdit: () => void;
  readonly onEditorNameChange: (value: string) => void;
  readonly onEditorCronExpressionChange: (value: string) => void;
  readonly onSavePaused: (scheduleId: string) => void;
  readonly onEnableRecurring: (scheduleId: string) => void;
  readonly onSaveChanges: (scheduleId: string, isEnabled: boolean) => void;
};

export function RecurrenceSchedulesTable(props: RecurrenceSchedulesTableProps): React.JSX.Element {
  const {
    schedules,
    displayTimeZoneId,
    editingId,
    editorState,
    busyId,
    canMutate,
    mutationDisabledReason,
    mutationDisabledHintId,
    onRememberSchedule,
    onToggleEnabled,
    onBeginEdit,
    onCancelEdit,
    onEditorNameChange,
    onEditorCronExpressionChange,
    onSavePaused,
    onEnableRecurring,
    onSaveChanges,
  } = props;

  return (
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
            <EnterpriseTableRow
              key={schedule.scheduleId}
              data-recurrence-schedule-id={schedule.scheduleId}
            >
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
                      onNameChange={onEditorNameChange}
                      onCronExpressionChange={onEditorCronExpressionChange}
                    />
                    <RecurrenceScheduleActivationActions
                      mode="edit"
                      cronExpression={editorState.cronExpression}
                      pendingIsEnabled={editorState.isEnabled}
                      disabled={!canMutate}
                      busy={busyId === schedule.scheduleId}
                      onSavePaused={() => onSavePaused(schedule.scheduleId)}
                      onEnableRecurring={() => onEnableRecurring(schedule.scheduleId)}
                      onSaveChanges={() => onSaveChanges(schedule.scheduleId, editorState.isEnabled)}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={onCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <OperatorInventoryRowMoreActions
                    testId={`recurrence-more-${schedule.scheduleId}`}
                    primaryActions={
                      <>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/architecture/reviews/${schedule.sourceRunId}`}
                            onClick={() => {
                              onRememberSchedule(schedule.scheduleId);
                            }}
                          >
                            View
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === schedule.scheduleId || !canMutate}
                          aria-describedby={
                            mutationDisabledReason === null ? undefined : mutationDisabledHintId
                          }
                          onClick={() => onToggleEnabled(schedule)}
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
                        onClick={() => onBeginEdit(schedule)}
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
  );
}
