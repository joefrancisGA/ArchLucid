/**
 * Parses an API `*Utc` ISO-8601 instant to epoch milliseconds.
 * Offset-less values are treated as UTC — SQL `datetime2` often round-trips as
 * `DateTimeKind.Unspecified`, and System.Text.Json then omits `Z`, so `Date.parse`
 * would otherwise interpret UTC wall-clock as the browser's local zone.
 */
export function parseIsoUtcMs(isoUtc: string): number {
  const trimmed = isoUtc.trim();

  if (trimmed.length === 0) {
    return Number.NaN;
  }

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return Date.parse(trimmed);
  }

  return Date.parse(`${trimmed}Z`);
}

/** Formats an ISO-8601 instant for operator-facing UTC labels (locale-aware clock, fixed UTC zone). */
export function formatIsoUtcForDisplay(iso: string): string {
  try {
    const ms = parseIsoUtcMs(iso);

    if (Number.isNaN(ms)) {
      return iso;
    }

    return `${new Date(ms).toLocaleString(undefined, { timeZone: "UTC" })} UTC`;
  } catch {
    return iso;
  }
}
