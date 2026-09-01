function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Human-readable elapsed duration for operator prose (minutes, hours, or days). */
export function formatElapsedMinutesProse(elapsedMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(elapsedMinutes));

  if (safeMinutes < 60) {
    return `${safeMinutes} ${pluralize(safeMinutes, "minute", "minutes")}`;
  }

  const hours = Math.floor(safeMinutes / 60);

  if (hours < 48) {
    return `${hours} ${pluralize(hours, "hour", "hours")}`;
  }

  const days = Math.floor(safeMinutes / (60 * 24));

  return `${days} ${pluralize(days, "day", "days")}`;
}
