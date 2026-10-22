import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";

/** Next expected UTC instant for a recurrence cron, or null when the preview is invalid. */
export async function fetchRecurrenceSchedulePreviewNextRunUtc(
  cronExpression: string,
): Promise<string | null> {
  const result = await previewRecurrenceScheduleRuns({ cronExpression, count: 1 });

  if (result.isValid && result.nextRunUtc.length > 0) {
    return result.nextRunUtc[0] ?? null;
  }

  return null;
}
