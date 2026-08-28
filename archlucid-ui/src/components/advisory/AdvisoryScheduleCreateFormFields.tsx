"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADVISORY_SCHEDULE_DAY_OF_MONTH_OPTIONS,
  ADVISORY_SCHEDULE_DAY_OPTIONS,
  ADVISORY_SCHEDULE_FREQUENCY_OPTIONS,
  ADVISORY_SCHEDULE_HOUR_OPTIONS,
  ADVISORY_SCHEDULE_MINUTE_OPTIONS,
  type AdvisoryScheduleFrequency,
} from "@/lib/advisory-schedule-form";
import {
  ADVISORY_SCANS_SCHEDULES_ADVANCED_HELPER,
  ADVISORY_SCANS_SCHEDULES_ADVANCED_SUMMARY,
} from "@/lib/advisory-copy";
import {
  formatIanaTimeZoneOptionLabel,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";

import {
  ADVISORY_SCHEDULE_SELECT_CLASS,
  type useAdvisoryScheduleCreateForm,
} from "./use-advisory-schedule-create-form";

type FormViewModel = ReturnType<typeof useAdvisoryScheduleCreateForm>;

export type AdvisoryScheduleCreateFormFieldsProps = {
  readonly viewModel: FormViewModel;
};

export function AdvisoryScheduleCreateFormFields({ viewModel }: AdvisoryScheduleCreateFormFieldsProps) {
  const {
    form,
    advancedOpen,
    setAdvancedOpen,
    cronExpression,
    suggestedName,
    frequencySummary,
    ianaOptions,
    updateForm,
    canEdit,
    setCustomCronValid,
  } = viewModel;

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="advisory-schedule-name">
          Schedule name <span className="font-normal text-neutral-500 dark:text-neutral-400">(optional)</span>
        </Label>
        <Input
          id="advisory-schedule-name"
          value={form.name}
          placeholder={suggestedName}
          onChange={(event) => updateForm({ name: event.target.value, nameTouched: true })}
          readOnly={!canEdit}
        />
      </div>

      <fieldset className="grid gap-3" disabled={!canEdit}>
        <legend className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Frequency</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="advisory-schedule-frequency">How often</Label>
            <select
              id="advisory-schedule-frequency"
              className={ADVISORY_SCHEDULE_SELECT_CLASS}
              value={form.frequency}
              onChange={(event) => {
                const frequency = event.target.value as AdvisoryScheduleFrequency;
                updateForm({ frequency });

                if (frequency === "custom") {
                  setAdvancedOpen(true);
                }
              }}
              disabled={!canEdit}
            >
              {ADVISORY_SCHEDULE_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {form.frequency === "weekly" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="advisory-schedule-day-of-week">Day</Label>
              <select
                id="advisory-schedule-day-of-week"
                className={ADVISORY_SCHEDULE_SELECT_CLASS}
                value={form.dayOfWeek}
                onChange={(event) => updateForm({ dayOfWeek: Number(event.target.value) })}
                disabled={!canEdit}
              >
                {ADVISORY_SCHEDULE_DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.frequency === "monthly" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="advisory-schedule-day-of-month">Day of month</Label>
              <select
                id="advisory-schedule-day-of-month"
                className={ADVISORY_SCHEDULE_SELECT_CLASS}
                value={form.dayOfMonth}
                onChange={(event) => updateForm({ dayOfMonth: Number(event.target.value) })}
                disabled={!canEdit}
              >
                {ADVISORY_SCHEDULE_DAY_OF_MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {form.frequency !== "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="grid min-w-0 gap-1.5 border-0 p-0">
              <legend className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Time</legend>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="advisory-schedule-hour" className="sr-only">
                  Hour
                </Label>
                <select
                  id="advisory-schedule-hour"
                  className={ADVISORY_SCHEDULE_SELECT_CLASS}
                  value={form.hourOfDay}
                  onChange={(event) => updateForm({ hourOfDay: Number(event.target.value) })}
                  disabled={!canEdit}
                >
                  {ADVISORY_SCHEDULE_HOUR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label.replace(":00", "")}
                    </option>
                  ))}
                </select>
                <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-hidden="true">
                  :
                </span>
                <Label htmlFor="advisory-schedule-minute" className="sr-only">
                  Minute
                </Label>
                <select
                  id="advisory-schedule-minute"
                  className={ADVISORY_SCHEDULE_SELECT_CLASS}
                  value={form.minuteOfHour}
                  onChange={(event) => updateForm({ minuteOfHour: Number(event.target.value) })}
                  disabled={!canEdit}
                >
                  {ADVISORY_SCHEDULE_MINUTE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
            <div className="grid gap-1.5">
              <Label htmlFor="advisory-schedule-timezone">Time zone</Label>
              <select
                id="advisory-schedule-timezone"
                className={ADVISORY_SCHEDULE_SELECT_CLASS}
                value={normalizeIanaTimeZoneForSelect(form.timeZoneId)}
                onChange={(event) =>
                  updateForm({ timeZoneId: toStoredIanaTimeZoneId(event.target.value) })
                }
                disabled={!canEdit}
              >
                {ianaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatIanaTimeZoneOptionLabel(option.value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {form.frequency !== "custom" ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {frequencySummary}
          </p>
        ) : null}
      </fieldset>

      <details
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
        open={advancedOpen || form.frequency === "custom"}
        onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary
          className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="advisory-schedule-advanced-toggle"
        >
          {ADVISORY_SCANS_SCHEDULES_ADVANCED_SUMMARY}
        </summary>
        {advancedOpen || form.frequency === "custom" ? (
          <>
            <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ADVISORY_SCANS_SCHEDULES_ADVANCED_HELPER}
            </p>
            {form.frequency !== "custom" ? (
              <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Generated expression (UTC): <code className="font-mono">{cronExpression}</code>
              </p>
            ) : null}
            <div className="mt-3">
              <CronExpressionBuilder
                value={form.frequency === "custom" ? form.customCron : cronExpression}
                onChange={(next) => {
                  updateForm({ frequency: "custom", customCron: next, nameTouched: form.nameTouched });
                  setAdvancedOpen(true);
                }}
                disabled={!canEdit}
                advancedOnly
                hidePreview={form.frequency !== "custom"}
                previewTimeZoneId={form.timeZoneId}
                onPreviewValidityChange={setCustomCronValid}
                inputClassName={ADVISORY_SCHEDULE_SELECT_CLASS}
              />
            </div>
          </>
        ) : null}
      </details>
    </>
  );
}
