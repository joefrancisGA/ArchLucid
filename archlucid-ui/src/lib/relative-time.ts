import { parseIsoUtcMs } from "@/lib/format-iso-utc";

/** Calendar-day distance in the browser locale's local timezone (not elapsed 24h buckets). */
function diffLocalCalendarDays(fromMs: number, toMs: number): number {
  const from = new Date(fromMs);
  const to = new Date(toMs);
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toStart = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((toStart.getTime() - fromStart.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Human-readable relative time for UI lists (e.g. "2 hours ago").
 */
export function formatRelativeTime(isoUtc: string, nowMs: number = Date.now()): string {
  const t = parseIsoUtcMs(isoUtc);

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

  const diffDay = diffLocalCalendarDays(t, nowMs);

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

/** True when {@link formatRelativeTime} would render the locale “now” instant for `nowMs`. */
export function isLocaleRelativeNowIso(isoUtc: string, nowMs: number = Date.now()): boolean {
  const nowRelativeLabel = formatRelativeTime(new Date(nowMs).toISOString(), nowMs);

  return formatRelativeTime(isoUtc, nowMs) === nowRelativeLabel;
}

/** `Updated {relative} ({absolute})` — drops redundant locale “now” when absolute time is shown. */
export function formatUpdatedRelativeWithAbsoluteParenthetical(
  isoUtc: string,
  absoluteLabel: string,
): string {
  if (isLocaleRelativeNowIso(isoUtc)) {
    return `Updated ${absoluteLabel}`;
  }

  return `Updated ${formatRelativeTime(isoUtc)} (${absoluteLabel})`;
}

/** `Updated {absolute} · {relative}` — drops redundant locale “now” when absolute time is shown. */
export function formatUpdatedAbsoluteWithRelative(
  isoUtc: string,
  absoluteLabel: string | null,
): string {
  const relative = formatRelativeTime(isoUtc);

  if (absoluteLabel === null) {
    return `Updated ${relative}`;
  }

  if (isLocaleRelativeNowIso(isoUtc)) {
    return `Updated ${absoluteLabel}`;
  }

  return `Updated ${absoluteLabel} · ${relative}`;
}
