"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADVISORY_SCHEDULE_DAY_OF_MONTH_OPTIONS,
  ADVISORY_SCHEDULE_DAY_OPTIONS,
  ADVISORY_SCHEDULE_FREQUENCY_OPTIONS,
  ADVISORY_SCHEDULE_HOUR_OPTIONS,
  ADVISORY_SCHEDULE_MINUTE_OPTIONS,
  buildAdvisoryScheduleCronExpression,
  createDefaultAdvisoryScheduleFormState,
  describeAdvisoryScheduleFrequency,
  isAdvisoryScheduleFormReadyToCreate,
  resolveAdvisoryScheduleName,
  suggestedAdvisoryScheduleName,
  type AdvisoryScheduleFormState,
  type AdvisoryScheduleFrequency,
} from "@/lib/advisory-schedule-form";
import {
  ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS,
  EMPTY_ADVISORY_SCHEDULE_PREVIEW,
  loadAdvisoryScheduleUpcomingPreview,
  type AdvisorySchedulePreviewState,
} from "@/lib/advisory-schedule-upcoming-preview";
import {
  ADVISORY_SCANS_SCHEDULES_ADVANCED_HELPER,
  ADVISORY_SCANS_SCHEDULES_ADVANCED_SUMMARY,
  ADVISORY_SCANS_SCHEDULES_CREATE_WORKING,
  ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED,
  ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT,
  ADVISORY_SCANS_SCHEDULES_SCOPE_HELPER,
  ADVISORY_SCANS_SCHEDULES_TIMING_NOTE,
} from "@/lib/advisory-copy";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  formatIanaTimeZoneOptionLabel,
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

export type AdvisoryScheduleCreateFormProps = {
  readonly canEdit: boolean;
  readonly sampleModeBlocked: boolean;
  readonly creating: boolean;
  readonly createSuccess: boolean;
  readonly projectLabel: string;
  readonly onCreate: (input: {
    readonly name: string;
    readonly cronExpression: string;
    readonly runProjectSlug: string;
  }) => Promise<void>;
  readonly runProjectSlug: string;
  readonly formResetKey: number;
};

export function AdvisoryScheduleCreateForm(props: AdvisoryScheduleCreateFormProps): ReactElement {
  const [form, setForm] = useState<AdvisoryScheduleFormState>(() => createDefaultAdvisoryScheduleFormState());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preview, setPreview] = useState<AdvisorySchedulePreviewState>(EMPTY_ADVISORY_SCHEDULE_PREVIEW);
  const ianaOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);

  useEffect(() => {
    setForm(createDefaultAdvisoryScheduleFormState());
    setAdvancedOpen(false);
  }, [props.formResetKey]);

  const cronExpression = useMemo(() => buildAdvisoryScheduleCronExpression(form), [form]);
  const suggestedName = useMemo(
    () => suggestedAdvisoryScheduleName(form, props.projectLabel),
    [form, props.projectLabel],
  );
  const frequencySummary = useMemo(() => describeAdvisoryScheduleFrequency(form), [form]);
  const formReady = isAdvisoryScheduleFormReadyToCreate(form) && preview.isValid;

  useEffect(() => {
    if (form.frequency === "custom" && advancedOpen) {
      return;
    }

    let canceled = false;
    setPreview((current) => ({ ...current, loading: true }));

    const timer = window.setTimeout(() => {
      void loadAdvisoryScheduleUpcomingPreview(cronExpression, form.timeZoneId).then((next) => {
        if (!canceled) {
          setPreview(next);
        }
      });
    }, ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [advancedOpen, cronExpression, form.frequency, form.timeZoneId]);

  function updateForm(patch: Partial<AdvisoryScheduleFormState>): void {
    setForm((current) => {
      const next: AdvisoryScheduleFormState = { ...current, ...patch };

      if (!current.nameTouched && patch.frequency !== undefined) {
        return {
          ...next,
          name: suggestedAdvisoryScheduleName({ ...next, nameTouched: false }, props.projectLabel),
        };
      }

      return next;
    });
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!props.canEdit || props.creating || !formReady) {
      return;
    }

    await props.onCreate({
      name: resolveAdvisoryScheduleName(form, props.projectLabel),
      cronExpression,
      runProjectSlug: props.runProjectSlug,
    });
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
      data-testid="advisory-schedule-create-form"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>New schedule</h3>

      {/* TB-1573: scope is inline near the form — not a persistent Schedule scope rail. */}
      <div className="mt-2 space-y-1" data-testid="advisory-schedule-inline-scope">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Project. </span>
          {ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT}: {props.projectLabel}
        </p>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_SCOPE_HELPER}
        </p>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_TIMING_NOTE}
        </p>
      </div>

      {props.sampleModeBlocked ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="advisory-schedules-sample-blocked"
        >
          {ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED}{" "}
          <Link className="text-al-link underline-offset-2 hover:underline" href="/get-started">
            Start an evaluation
          </Link>
          .
        </p>
      ) : null}

      <form onSubmit={(event) => void onSubmit(event)} className="mt-3 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="advisory-schedule-name">
            Schedule name <span className="font-normal text-neutral-500 dark:text-neutral-400">(optional)</span>
          </Label>
          <Input
            id="advisory-schedule-name"
            value={form.name}
            placeholder={suggestedName}
            onChange={(event) => updateForm({ name: event.target.value, nameTouched: true })}
            readOnly={!props.canEdit}
            title={props.canEdit ? undefined : enterpriseMutationControlDisabledTitle}
          />
        </div>

        <fieldset className="grid gap-3" disabled={!props.canEdit}>
          <legend className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Frequency</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="advisory-schedule-frequency">How often</Label>
              <select
                id="advisory-schedule-frequency"
                className={SELECT_CLASS}
                value={form.frequency}
                onChange={(event) => {
                  const frequency = event.target.value as AdvisoryScheduleFrequency;
                  updateForm({ frequency });

                  if (frequency === "custom") {
                    setAdvancedOpen(true);
                  }
                }}
                disabled={!props.canEdit}
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
                  className={SELECT_CLASS}
                  value={form.dayOfWeek}
                  onChange={(event) => updateForm({ dayOfWeek: Number(event.target.value) })}
                  disabled={!props.canEdit}
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
                  className={SELECT_CLASS}
                  value={form.dayOfMonth}
                  onChange={(event) => updateForm({ dayOfMonth: Number(event.target.value) })}
                  disabled={!props.canEdit}
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="advisory-schedule-hour">Time</Label>
                <select
                  id="advisory-schedule-hour"
                  className={SELECT_CLASS}
                  value={form.hourOfDay}
                  onChange={(event) => updateForm({ hourOfDay: Number(event.target.value) })}
                  disabled={!props.canEdit}
                  aria-label="Hour"
                >
                  {ADVISORY_SCHEDULE_HOUR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label.replace(":00", "")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="advisory-schedule-minute">Minutes</Label>
                <select
                  id="advisory-schedule-minute"
                  className={SELECT_CLASS}
                  value={form.minuteOfHour}
                  onChange={(event) => updateForm({ minuteOfHour: Number(event.target.value) })}
                  disabled={!props.canEdit}
                  aria-label="Minutes"
                >
                  {ADVISORY_SCHEDULE_MINUTE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="advisory-schedule-timezone">Time zone</Label>
                <select
                  id="advisory-schedule-timezone"
                  className={SELECT_CLASS}
                  value={normalizeIanaTimeZoneForSelect(form.timeZoneId)}
                  onChange={(event) =>
                    updateForm({ timeZoneId: toStoredIanaTimeZoneId(event.target.value) })
                  }
                  disabled={!props.canEdit}
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

        {form.frequency !== "custom" ? (
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
            data-testid="advisory-schedule-upcoming-preview"
          >
            <p
              className={cn(
                "m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              Next scheduled runs
            </p>
            {preview.loading ? (
              <p
                className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
                aria-live="polite"
              >
                Updating preview…
              </p>
            ) : null}
            {preview.validationError !== null ? (
              <p className={cn("m-0 mt-2 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {preview.validationError}
              </p>
            ) : null}
            {preview.runs.length > 0 ? (
              <ol
                className={cn(
                  "m-0 mt-2 list-decimal space-y-1 pl-5 text-neutral-800 dark:text-neutral-200",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {preview.runs.map((run) => (
                  <li key={run.iso}>
                    <span>{run.primary}</span>
                    <span
                      className={cn("ml-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {run.utcSecondary}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
            <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Generated expression (UTC): <code className="font-mono">{cronExpression}</code>
            </p>
          </div>
        ) : null}

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
              <div className="mt-3">
                <CronExpressionBuilder
                  value={form.frequency === "custom" ? form.customCron : cronExpression}
                  onChange={(next) => {
                    updateForm({ frequency: "custom", customCron: next, nameTouched: form.nameTouched });
                    setAdvancedOpen(true);
                  }}
                  disabled={!props.canEdit}
                  advancedOnly
                  previewTimeZoneId={form.timeZoneId}
                  inputClassName={SELECT_CLASS}
                />
              </div>
            </>
          ) : null}
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={!props.canEdit || props.creating || !formReady}
            title={props.canEdit ? undefined : enterpriseMutationControlDisabledTitle}
            data-testid="advisory-schedule-create-submit"
          >
            {props.creating ? ADVISORY_SCANS_SCHEDULES_CREATE_WORKING : "Create schedule"}
          </Button>
          {props.createSuccess ? (
            <p className={cn("m-0 text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)} role="status">
              Schedule created.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
