export type CronSchedulePresetId = "daily-7utc" | "hourly" | "daily" | "weekly" | "custom";

export type CronSchedulePreset = {
  id: Exclude<CronSchedulePresetId, "custom">;
  label: string;
  expression: string;
  description: string;
};

export const CRON_SCHEDULE_PRESETS: readonly CronSchedulePreset[] = [
  {
    id: "daily-7utc",
    label: "Daily at 07:00 UTC",
    expression: "0 7 * * *",
    description: "Once per day at 07:00 UTC (recommended).",
  },
  {
    id: "hourly",
    label: "Every hour",
    expression: "@hourly",
    description: "Runs about one hour after each completed tick.",
  },
  {
    id: "daily",
    label: "Every 24 hours",
    expression: "@daily",
    description: "Runs one day after each reference instant.",
  },
  {
    id: "weekly",
    label: "Every 7 days",
    expression: "@weekly",
    description: "Runs seven days after each reference instant.",
  },
] as const;

export function findCronSchedulePresetByExpression(expression: string): CronSchedulePreset | undefined {
  const trimmed = expression.trim();

  return CRON_SCHEDULE_PRESETS.find((preset) => preset.expression === trimmed);
}

export function resolveCronSchedulePresetId(expression: string): CronSchedulePresetId {
  const match = findCronSchedulePresetByExpression(expression);

  return match?.id ?? "custom";
}
