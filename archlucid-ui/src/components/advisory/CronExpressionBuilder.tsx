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
};

function formatPreviewUtc(instant: Date): string {
  const iso = instant.toISOString();

  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/**
 * Preset + custom cron editor with server-authoritative next-run preview (UTC).
 */
export function CronExpressionBuilder({
  value,
  onChange,
  disabled = false,
  inputClassName,
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

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);

      void previewRecurrenceScheduleRuns({
        cronExpression: trimmedValue,
        count: PREVIEW_COUNT,
      })
        .then((response) => {
          if (cancelled) {
            return;
          }

          if (!response.isValid) {
            setValidationError(response.validationError ?? "Unsupported or invalid cron expression.");
            setPreviewRuns([]);

            return;
          }

          setValidationError(null);
          setPreviewRuns(response.nextRunUtc.map((instant) => new Date(instant)));
        })
        .catch(() => {
          if (!cancelled) {
            setValidationError("Could not load schedule preview from the server.");
            setPreviewRuns([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedValue]);

  const previewList = useMemo(
    () =>
      previewRuns.map((instant) => (
        <li key={instant.toISOString()}>{formatPreviewUtc(instant)}</li>
      )),
    [previewRuns],
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

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Schedule</legend>

      <label className={cn("block text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Preset
        <Select
          value={presetId}
          onValueChange={onPresetChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn("mt-1", inputClassName)} aria-label="Cron schedule preset">
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

      {activePreset !== undefined ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{activePreset.description}</p>
      ) : null}

      <label className={cn("block text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Cron expression (UTC)
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
        Supported presets: <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@hourly</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@daily</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@weekly</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">0 7 * * *</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">0 8 * * 1</code>, or another valid five-field UTC cron.
        Invalid expressions are rejected when you save.
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
        <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Next {PREVIEW_COUNT} scheduled runs (UTC)
        </p>
        {previewLoading ? (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
            Loading server preview…
          </p>
        ) : previewRuns.length > 0 ? (
          <ol className={cn("m-0 mt-2 list-decimal space-y-1 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
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
