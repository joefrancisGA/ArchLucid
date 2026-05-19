/**
 * Client mirror of {@link SimpleScanScheduleCalculator} — not a full CRON engine.
 * Unknown expressions fall back to +1 day from the reference instant.
 */

export function computeNextRunUtc(cronExpression: string, fromUtc: Date): Date | null {
  const cron = cronExpression.trim();

  switch (cron) {
    case "@hourly":
      return addHours(fromUtc, 1);
    case "@daily":
      return addDays(fromUtc, 1);
    case "@weekly":
      return addDays(fromUtc, 7);
    case "0 7 * * *":
      return nextDailyAtSevenAmUtc(fromUtc);
    default:
      return addDays(fromUtc, 1);
  }
}

/** Next N run instants (UTC), matching server schedule advancement between ticks. */
export function computeNextScheduledRunTimes(
  cronExpression: string,
  count: number,
  fromUtc: Date = new Date(),
): Date[] {
  if (count <= 0) {
    return [];
  }

  const results: Date[] = [];
  let cursor = fromUtc;

  for (let i = 0; i < count; i += 1) {
    const next = computeNextRunUtc(cronExpression, cursor);

    if (next === null) {
      break;
    }

    results.push(next);
    cursor = next;
  }

  return results;
}

function nextDailyAtSevenAmUtc(fromUtc: Date): Date {
  const todaySeven = new Date(
    Date.UTC(fromUtc.getUTCFullYear(), fromUtc.getUTCMonth(), fromUtc.getUTCDate(), 7, 0, 0, 0),
  );

  if (fromUtc.getTime() < todaySeven.getTime()) {
    return todaySeven;
  }

  return new Date(
    Date.UTC(fromUtc.getUTCFullYear(), fromUtc.getUTCMonth(), fromUtc.getUTCDate() + 1, 7, 0, 0, 0),
  );
}

function addHours(fromUtc: Date, hours: number): Date {
  return new Date(fromUtc.getTime() + hours * 60 * 60 * 1000);
}

function addDays(fromUtc: Date, days: number): Date {
  return new Date(fromUtc.getTime() + days * 24 * 60 * 60 * 1000);
}
