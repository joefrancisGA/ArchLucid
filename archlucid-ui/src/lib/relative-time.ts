/**
 * Human-readable relative time for UI lists (e.g. "2 hours ago").
 */
export function formatRelativeTime(isoUtc: string, nowMs: number = Date.now()): string {
  const t = Date.parse(isoUtc);

  if (Number.isNaN(t)) {
    return isoUtc;
  }

  const diffSec = Math.round((nowMs - t) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (abs < 60) {
    return rtf.format(-diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);

  if (Math.abs(diffMin) < 60) {
    return rtf.format(-diffMin, "minute");
  }

  const diffHour = Math.round(diffMin / 60);

  if (Math.abs(diffHour) < 24) {
    return rtf.format(-diffHour, "hour");
  }

  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffDay) < 30) {
    return rtf.format(-diffDay, "day");
  }

  const diffMonth = Math.round(diffDay / 30);

  if (Math.abs(diffMonth) < 12) {
    return rtf.format(-diffMonth, "month");
  }

  const diffYear = Math.round(diffDay / 365);

  return rtf.format(-diffYear, "year");
}
