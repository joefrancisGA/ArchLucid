import { findCronSchedulePresetByExpression } from "@/lib/cron-schedule-presets";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type FiveFieldUtcCron = {
  readonly minute: number;
  readonly hour: number;
  readonly dayOfMonth: string;
  readonly month: string;
  readonly dayOfWeek: string;
};

export type CadenceKind = "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "custom";

export function parseReferenceUtc(referenceUtc: string | Date | null | undefined): Date {
  if (referenceUtc instanceof Date) {
    return Number.isFinite(referenceUtc.getTime()) ? referenceUtc : new Date("2026-07-20T12:00:00.000Z");
  }

  if (typeof referenceUtc === "string" && referenceUtc.trim().length > 0) {
    const parsed = new Date(referenceUtc);

    if (Number.isFinite(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export function parseFiveFieldUtcCron(expression: string): FiveFieldUtcCron | null {
  const trimmed = expression.trim();

  if (trimmed.startsWith("@")) {
    return null;
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return null;
  }

  const minute = Number(parts[0]);
  const hour = Number(parts[1]);

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }

  return {
    minute,
    hour,
    dayOfMonth: parts[2] ?? "*",
    month: parts[3] ?? "*",
    dayOfWeek: parts[4] ?? "*",
  };
}

function formatUtcClockLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} UTC`;
}

export function ordinalDay(day: number): string {
  const mod100 = day % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function classifyCadence(parsed: FiveFieldUtcCron): CadenceKind {
  if (parsed.dayOfWeek !== "*" && parsed.dayOfMonth === "*") {
    return "weekly";
  }

  if (parsed.month === "*/3" && parsed.dayOfMonth !== "*") {
    return "quarterly";
  }

  const monthNum = parseSingleCronField(parsed.month);
  const domNum = parseSingleCronField(parsed.dayOfMonth);

  if (monthNum !== null && domNum !== null && parsed.dayOfWeek === "*") {
    return "annual";
  }

  if (parsed.dayOfMonth !== "*" && parsed.dayOfWeek === "*") {
    return "monthly";
  }

  if (parsed.dayOfMonth === "*" && parsed.dayOfWeek === "*" && parsed.month === "*") {
    return "daily";
  }

  return "custom";
}

export function parseSingleCronField(field: string): number | null {
  if (!/^\d+$/.test(field)) {
    return null;
  }

  return Number(field);
}

export function describeUtcCadence(cronExpression: string, parsed: FiveFieldUtcCron | null): string {
  const preset = findCronSchedulePresetByExpression(cronExpression);

  if (preset !== undefined) {
    return preset.label;
  }

  if (parsed === null) {
    const trimmed = cronExpression.trim();

    return trimmed.length > 0 ? `UTC cron: ${trimmed}` : "UTC schedule";
  }

  const clock = formatUtcClockLabel(parsed.hour, parsed.minute);
  const kind = classifyCadence(parsed);

  if (kind === "weekly") {
    const dow = parseSingleCronField(parsed.dayOfWeek);
    const dayName = dow !== null ? DAY_NAMES[dow] ?? "day" : "selected days";

    return `Weekly on ${dayName} at ${clock}`;
  }

  if (kind === "daily") {
    return `Daily at ${clock}`;
  }

  if (kind === "quarterly") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;

    return `Quarterly on the ${ordinalDay(dom)} at ${clock}`;
  }

  if (kind === "annual") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;
    const month = parseSingleCronField(parsed.month) ?? 1;
    const monthName = MONTH_NAMES[month - 1] ?? "month";

    return `Annually on ${monthName} ${dom} at ${clock}`;
  }

  if (kind === "monthly") {
    const dom = parseSingleCronField(parsed.dayOfMonth) ?? 1;

    return `Monthly on the ${ordinalDay(dom)} at ${clock}`;
  }

  return `UTC cron: ${cronExpression.trim()}`;
}

export function matchesUtcCron(instant: Date, parsed: FiveFieldUtcCron): boolean {
  if (instant.getUTCMinutes() !== parsed.minute || instant.getUTCHours() !== parsed.hour) {
    return false;
  }

  const dow = parseSingleCronField(parsed.dayOfWeek);

  if (dow !== null && instant.getUTCDay() !== dow) {
    return false;
  }

  const dom = parseSingleCronField(parsed.dayOfMonth);

  if (dom !== null && instant.getUTCDate() !== dom) {
    return false;
  }

  if (parsed.month === "*/3") {
    // Months 1,4,7,10 — common quarterly pattern used by recurrence examples.
    const month = instant.getUTCMonth() + 1;

    if (month % 3 !== 1) {
      return false;
    }
  } else {
    const month = parseSingleCronField(parsed.month);

    if (month !== null && instant.getUTCMonth() + 1 !== month) {
      return false;
    }
  }

  return true;
}

/** Walks forward day-by-day from reference to find a UTC instant matching the cron wall fields. */
export function findRepresentativeUtcInstantForCron(
  cronExpression: string,
  referenceUtc?: string | Date | null,
): Date | null {
  const parsed = parseFiveFieldUtcCron(cronExpression);

  if (parsed === null) {
    return null;
  }

  const start = parseReferenceUtc(referenceUtc);
  let cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
      parsed.hour,
      parsed.minute,
      0,
      0,
    ),
  );

  if (cursor.getTime() <= start.getTime()) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  for (let i = 0; i < 400; i += 1) {
    if (matchesUtcCron(cursor, parsed)) {
      return cursor;
    }

    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return null;
}
