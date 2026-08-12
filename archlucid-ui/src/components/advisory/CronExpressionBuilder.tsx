"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAdvisoryScheduleInstant } from "@/lib/advisory-schedule-form";
import {
  CRON_SCHEDULE_PRESETS,
  resolveCronSchedulePresetId,
} from "@/lib/cron-schedule-presets";
import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";

const PREVIEW_COUNT = 5;
const PREVIEW_DEBOUNCE_MS = 250;

export type CronExpressionBuilderProps = {
  value: string;
  onChange: (cronExpression: string) => void;
  disabled?: boolean;
  inputClassName?: string;
  /**
   * When true, hides customer presets and `@hourly`/`@daily`/`@weekly` tokens —
   * intended for the advisory schedules Advanced scheduling disclosure.
   */
  advancedOnly?: boolean;
  /** IANA zone used to format upcoming-run previews (default UTC labels). */
  previewTimeZoneId?: string;
  /** Optional override for the preview heading. */
  previewHeading?: string;
};

function formatPreviewLabel(instant: Date, timeZoneId: string | undefined): string {
  if (timeZoneId === undefined || timeZoneId.trim().length === 0 || timeZoneId === "UTC") {
    const iso = instant.toISOString();

    return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
  }

  return formatAdvisoryScheduleInstant(instant, timeZoneId).primary;
}

/**
 * Preset + custom schedule editor with server-authoritative next-run preview.
 * For customer advisory schedules, prefer the simple frequency form and pass `advancedOnly`.
 */
export function CronExpressionBuilder({
  value,
  onChange,
  disabled = false,
  inputClassName,
  advancedOnly = false,
  previewTimeZoneId,
  previewHeading,
}: CronExpressionBuilderProps) {
  const presetId = resolveCronSchedulePresetId(value);
  const activePreset = CRON_SCHEDULE_PRESETS.find((preset) => preset.id === presetId);
  const [previewRuns, setPreviewRuns] = useState<readonly Date[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const trimmedValue = value.trim();

  useEffect(() => {
    if (trimmedValue.length === 0) {
      setPreviewRuns([]);
      setValidationError(null);
      setPreviewLoading(false);

      return;
    }

    let canceled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);

      void previewRecurrenceScheduleRuns({
        cronExpression: trimmedValue,
        count: PREVIEW_COUNT,
      })
        .then((response) => {
          if (canceled) {
            return;
          }

          if (!response.isValid) {
            setValidationError(
              response.validationError ??
                "That schedule pattern is not supported. Use a valid five-field UTC expression.",
            );
            setPreviewRuns([]);

            return;
          }

          setValidationError(null);
          setPreviewRuns(response.nextRunUtc.map((instant) => new Date(instant)));
        })
        .catch(() => {
          if (!canceled) {
            setValidationError("Could not load schedule preview from the server.");
            setPreviewRuns([]);
          }
        })
        .finally(() => {
          if (!canceled) {
            setPreviewLoading(false);
          }
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedValue]);

  const previewList = useMemo(
    () =>
      previewRuns.map((instant) => (
        <li key={instant.toISOString()}>
          <span>{formatPreviewLabel(instant, previewTimeZoneId)}</span>
          {previewTimeZoneId !== undefined &&
          previewTimeZoneId.trim().length > 0 &&
          previewTimeZoneId !== "UTC" ? (
            <span className={cn("ml-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {formatAdvisoryScheduleInstant(instant, previewTimeZoneId).utcSecondary}
            </span>
          ) : null}
        </li>
      )),
    [previewRuns, previewTimeZoneId],
  );

  function onPresetChange(nextPresetId: string): void {
    if (nextPresetId === "custom") {
      return;
    }

    const preset = CRON_SCHEDULE_PRESETS.find((item) => item.id === nextPresetId);

    if (preset !== undefined) {
      onChange(preset.expression);
    }
  }

  const heading =
    previewHeading ??
    (previewTimeZoneId !== undefined && previewTimeZoneId !== "UTC"
      ? `Next ${PREVIEW_COUNT} scheduled runs`
      : `Next ${PREVIEW_COUNT} scheduled runs (UTC)`);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {advancedOnly ? "Advanced schedule expression" : "Schedule"}
      </legend>

      {!advancedOnly ? (
        <label className={cn("block text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Preset
          <Select value={presetId} onValueChange={onPresetChange} disabled={disabled}>
            <SelectTrigger className={cn("mt-1", inputClassName)} aria-label="Schedule preset">
              <SelectValue placeholder="Choose a schedule" />
            </SelectTrigger>
            <SelectContent>
              {CRON_SCHEDULE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom expression</SelectItem>
            </SelectContent>
          </Select>
        </label>
      ) : null}

      {!advancedOnly && activePreset !== undefined ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {activePreset.description}
        </p>
      ) : null}

      <label className={cn("block text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {advancedOnly ? "Expression (UTC)" : "Cron expression (UTC)"}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={disabled}
          className={cn(inputClassName, "mt-1 font-mono")}
          aria-describedby="cron-expression-hint cron-next-runs-preview"
          aria-invalid={validationError !== null}
          data-testid="cron-expression-input"
        />
      </label>

      <p id="cron-expression-hint" className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {advancedOnly
          ? "Enter a five-field UTC expression (minute hour day-of-month month day-of-week). Unsupported patterns are rejected before save."
          : "Supported presets include daily and weekly UTC times, or another valid five-field UTC expression. Invalid expressions are rejected when you save."}
      </p>

      {validationError !== null ? (
        <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {validationError}
        </p>
      ) : null}

      <div
        id="cron-next-runs-preview"
        className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
        data-testid="cron-next-runs-preview"
      >
        <p
          className={cn(
            "m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {heading}
        </p>
        {previewLoading ? (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
            Loading preview…
          </p>
        ) : previewRuns.length > 0 ? (
          <ol
            className={cn(
              "m-0 mt-2 list-decimal space-y-1 pl-5 text-neutral-800 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {previewList}
          </ol>
        ) : (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Enter a supported expression to preview runs.
          </p>
        )}
      </div>
    </fieldset>
  );
}
