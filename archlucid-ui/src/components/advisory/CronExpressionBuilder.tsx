"use client";

import { useMemo } from "react";

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
import { computeNextScheduledRunTimes } from "@/lib/simple-scan-schedule-calculator";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 5;

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
 * Preset + custom cron editor with next-run preview (matches server {@link SimpleScanScheduleCalculator}).
 */
export function CronExpressionBuilder({
  value,
  onChange,
  disabled = false,
  inputClassName,
}: CronExpressionBuilderProps) {
  const presetId = resolveCronSchedulePresetId(value);
  const activePreset = CRON_SCHEDULE_PRESETS.find((preset) => preset.id === presetId);

  const previewRuns = useMemo(
    () => computeNextScheduledRunTimes(value, PREVIEW_COUNT),
    [value],
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
      <legend className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Schedule</legend>

      <label className="block text-sm text-neutral-700 dark:text-neutral-300">
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
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">{activePreset.description}</p>
      ) : null}

      <label className="block text-sm text-neutral-700 dark:text-neutral-300">
        Cron expression
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={disabled}
          className={cn(inputClassName, "mt-1 font-mono")}
          aria-describedby="cron-expression-hint cron-next-runs-preview"
          data-testid="cron-expression-input"
        />
      </label>

      <p id="cron-expression-hint" className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
        Supported presets: <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@hourly</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@daily</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">@weekly</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">0 7 * * *</code>. Other values default to
        +1 day between runs (same as the API worker).
      </p>

      <div
        id="cron-next-runs-preview"
        className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
        data-testid="cron-next-runs-preview"
      >
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Next {PREVIEW_COUNT} scheduled runs (UTC)
        </p>
        {previewRuns.length > 0 ? (
          <ol className="m-0 mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
            {previewRuns.map((instant) => (
              <li key={instant.toISOString()}>{formatPreviewUtc(instant)}</li>
            ))}
          </ol>
        ) : (
          <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">Enter an expression to preview runs.</p>
        )}
      </div>
    </fieldset>
  );
}
