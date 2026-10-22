import { formatIanaTimeZoneOptionLabel } from "@/lib/iana-time-zone-select";

import {
  ADVISORY_SCHEDULE_DAY_OPTIONS,
  type AdvisoryScheduleFormState,
} from "./advisory-schedule-form-state";
import { findNextLocalOccurrence, formatLocalClockLabel } from "./advisory-schedule-timezone";

/** Builds a five-field UTC cron expression from customer-friendly controls. */
export function buildAdvisoryScheduleCronExpression(form: AdvisoryScheduleFormState): string {
  if (form.frequency === "custom") {
    return form.customCron.trim();
  }

  const next = findNextLocalOccurrence(form);
  const minute = next.getUTCMinutes();
  const hour = next.getUTCHours();
  const dayOfWeek = next.getUTCDay();
  const dayOfMonth = next.getUTCDate();

  if (form.frequency === "daily") {
    return `${minute} ${hour} * * *`;
  }

  if (form.frequency === "weekdays") {
    return `${minute} ${hour} * * 1-5`;
  }

  if (form.frequency === "weekly") {
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }

  return `${minute} ${hour} ${dayOfMonth} * *`;
}

export function describeAdvisoryScheduleFrequency(form: AdvisoryScheduleFormState): string {
  const clock = formatLocalClockLabel(form.hourOfDay, form.minuteOfHour);
  const zone = formatIanaTimeZoneOptionLabel(form.timeZoneId);

  switch (form.frequency) {
    case "daily":
      return `Daily at ${clock} (${zone})`;
    case "weekdays":
      return `Weekdays at ${clock} (${zone})`;
    case "weekly": {
      const day =
        ADVISORY_SCHEDULE_DAY_OPTIONS.find((option) => option.value === form.dayOfWeek)?.label ?? "Monday";

      return `Weekly on ${day} at ${clock} (${zone})`;
    }
    case "monthly":
      return `Monthly on day ${form.dayOfMonth} at ${clock} (${zone})`;
    case "custom":
      return "Custom schedule";
    default: {
      const _exhaustive: never = form.frequency;

      return _exhaustive;
    }
  }
}

export function describeStoredCronExpression(cronExpression: string): string {
  const trimmed = cronExpression.trim();

  if (trimmed === "@hourly") {
    return "About every hour";
  }

  if (trimmed === "@daily") {
    return "About every 24 hours";
  }

  if (trimmed === "@weekly") {
    return "About every 7 days";
  }

  const fiveField = /^(\d+)\s+(\d+)\s+(\*|\d+)\s+\*\s+(\*|\d(?:-\d)?)$/.exec(trimmed);

  if (fiveField === null) {
    return "Custom schedule";
  }

  const minute = Number(fiveField[1]);
  const hour = Number(fiveField[2]);
  const dayOfMonth = fiveField[3];
  const dayOfWeek = fiveField[4];
  const clock = formatLocalClockLabel(hour, minute);

  if (dayOfMonth === "*" && dayOfWeek === "*") {
    return `Daily at ${clock} UTC`;
  }

  if (dayOfMonth === "*" && dayOfWeek === "1-5") {
    return `Weekdays at ${clock} UTC`;
  }

  if (dayOfMonth === "*" && /^\d$/.test(dayOfWeek)) {
    const day =
      ADVISORY_SCHEDULE_DAY_OPTIONS.find((option) => option.value === Number(dayOfWeek))?.label ??
      "selected day";

    return `Weekly on ${day} at ${clock} UTC`;
  }

  if (dayOfWeek === "*" && /^\d+$/.test(dayOfMonth)) {
    return `Monthly on day ${dayOfMonth} at ${clock} UTC`;
  }

  return "Custom schedule";
}
