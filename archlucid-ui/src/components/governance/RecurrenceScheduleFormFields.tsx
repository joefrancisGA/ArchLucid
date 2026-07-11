"use client";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleFormFieldsProps = {
  readonly name: string;
  readonly cronExpression: string;
  readonly showSourceRunId?: boolean;
  readonly sourceRunId?: string;
  readonly disabled?: boolean;
  readonly onNameChange: (value: string) => void;
  readonly onCronExpressionChange: (value: string) => void;
  readonly onSourceRunIdChange?: (value: string) => void;
};

/** Shared create/edit fields for architecture review recurrence schedules. */
export function RecurrenceScheduleFormFields(props: RecurrenceScheduleFormFieldsProps) {
  const {
    name,
    cronExpression,
    showSourceRunId = false,
    sourceRunId = "",
    disabled = false,
    onNameChange,
    onCronExpressionChange,
    onSourceRunIdChange,
  } = props;

  return (
    <div className="space-y-4">
      {showSourceRunId ? (
        <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
          <span className={OPERATOR_TYPOGRAPHY.label}>
            Review package ID <span className="text-red-700 dark:text-red-400">*</span>
          </span>
          <input
            required
            value={sourceRunId}
            disabled={disabled}
            onChange={(event) => onSourceRunIdChange?.(event.target.value)}
            className={cn(
              "rounded border border-neutral-300 bg-white px-2 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            placeholder="Committed review package GUID"
            data-testid="recurrence-schedule-source-run-id"
            aria-describedby="recurrence-schedule-source-run-hint"
          />
          <span
            id="recurrence-schedule-source-run-hint"
            className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            Use the committed review package that should be cloned on each scheduled run.
          </span>
        </label>
      ) : null}

      <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span className={OPERATOR_TYPOGRAPHY.label}>
          Schedule name <span className="text-red-700 dark:text-red-400">*</span>
        </span>
        <input
          required
          value={name}
          disabled={disabled}
          onChange={(event) => onNameChange(event.target.value)}
          className={cn(
            "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="recurrence-schedule-name"
        />
      </label>

      <CronExpressionBuilder
        value={cronExpression}
        onChange={onCronExpressionChange}
        disabled={disabled}
        inputClassName={cn(
          "w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
          OPERATOR_TYPOGRAPHY.body,
        )}
      />

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        All cadence times are evaluated in UTC. The server calculates the next run when you save.
      </p>
    </div>
  );
}
