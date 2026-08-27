"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
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
  ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL,
  ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED,
  ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT,
  ADVISORY_SCANS_SCHEDULES_TIMING_NOTE,
} from "@/lib/advisory-copy";
import {
  resolveAdvisoryScheduleCreateChecklistEmphasizedStepId,
  resolveAdvisoryScheduleCreateChecklistSteps,
} from "@/lib/advisory-schedule-create-checklist";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
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
  const [customCronValid, setCustomCronValid] = useState(false);
  const ianaOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);
  const mutationDisabledHintId = "advisory-schedule-create-mutate-disabled-hint";
  const mutationDisabledReason = props.canEdit ? null : whyDisabledEnterpriseMutationControl();

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
  const cronPreviewValid = form.frequency === "custom" ? customCronValid : preview.isValid;
  const formReady = isAdvisoryScheduleFormReadyToCreate(form) && cronPreviewValid;

  useEffect(() => {
    if (form.frequency === "custom") {
      setPreview(EMPTY_ADVISORY_SCHEDULE_PREVIEW);
      setCustomCronValid(false);
    }
  }, [form.frequency]);

  useEffect(() => {
    if (form.frequency === "custom") {
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
  }, [cronExpression, form.frequency, form.timeZoneId]);

  const showFormUpcomingPreview = form.frequency !== "custom";
  const advisoryCreateSteps = resolveAdvisoryScheduleCreateChecklistSteps({
    reviewConfigured: props.runProjectSlug.trim().length > 0,
    frequencyConfigured: cronPreviewValid,
    scheduleSaved: props.createSuccess,
  });
  const advisoryCreateEmphasizedStepId = resolveAdvisoryScheduleCreateChecklistEmphasizedStepId({
    reviewConfigured: props.runProjectSlug.trim().length > 0,
    frequencyConfigured: cronPreviewValid,
    scheduleSaved: props.createSuccess,
  });

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
      id="advisory-schedule-create-form"
      className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
      data-testid="advisory-schedule-create-form"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>New schedule</h3>

      <p
        className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="advisory-schedule-inline-scope"
      >
        <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT}:
        </span>{" "}
        <span data-testid="advisory-schedule-project-scope-label">{props.projectLabel}</span>
      </p>

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

      <IntegrationConnectChecklist
        title="Schedule checklist"
        steps={advisoryCreateSteps}
        emphasizedStepId={advisoryCreateEmphasizedStepId}
        testIdPrefix="advisory-schedule-create"
      />

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
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="grid min-w-0 gap-1.5 border-0 p-0">
                <legend className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Time</legend>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="advisory-schedule-hour" className="sr-only">
                    Hour
                  </Label>
                  <select
                    id="advisory-schedule-hour"
                    className={SELECT_CLASS}
                    value={form.hourOfDay}
                    onChange={(event) => updateForm({ hourOfDay: Number(event.target.value) })}
                    disabled={!props.canEdit}
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
                    className={SELECT_CLASS}
                    value={form.minuteOfHour}
                    onChange={(event) => updateForm({ minuteOfHour: Number(event.target.value) })}
                    disabled={!props.canEdit}
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

        {showFormUpcomingPreview ? (
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
              {ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ADVISORY_SCANS_SCHEDULES_TIMING_NOTE}
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
                  "m-0 mt-2 list-decimal space-y-2 pl-5 text-neutral-800 dark:text-neutral-200",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {preview.runs.map((occurrence) => (
                  <li key={occurrence.iso}>
                    <dl className="m-0 grid gap-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-3">
                      <div>
                        <dt className="sr-only">Local time</dt>
                        <dd className="m-0">{occurrence.primary}</dd>
                      </div>
                      <div>
                        <dt className="sr-only">UTC</dt>
                        <dd className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          ({occurrence.utcSecondary})
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>
            ) : null}
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
                  disabled={!props.canEdit}
                  advancedOnly
                  hidePreview={form.frequency !== "custom"}
                  previewTimeZoneId={form.timeZoneId}
                  onPreviewValidityChange={setCustomCronValid}
                  inputClassName={SELECT_CLASS}
                />
              </div>
            </>
          ) : null}
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={!props.canEdit || props.creating || !formReady}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            data-testid="advisory-schedule-create-submit"
          >
            {props.creating ? ADVISORY_SCANS_SCHEDULES_CREATE_WORKING : "Create schedule"}
          </Button>
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId={mutationDisabledHintId}
          />
          {props.createSuccess ? (
            <p className={cn("m-0 text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="status">
              Schedule created.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
