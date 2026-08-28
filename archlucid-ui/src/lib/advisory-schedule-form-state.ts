import { formatIanaTimeZoneOptionLabel, toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";
import { EXEC_DIGEST_HOUR_OPTIONS } from "@/lib/exec-digest-schedule-form";

import { resolveBrowserTimeZoneId } from "./advisory-schedule-timezone";

/** Customer-facing frequency choices mapped to five-field UTC cron. */
export type AdvisoryScheduleFrequency = "daily" | "weekdays" | "weekly" | "monthly" | "custom";

export type AdvisoryScheduleFormState = {
  readonly frequency: AdvisoryScheduleFrequency;
  /** Local wall-clock hour (0–23) in `timeZoneId`. */
  readonly hourOfDay: number;
  /** Local wall-clock minute (0–59). */
  readonly minuteOfHour: number;
  readonly timeZoneId: string;
  /** Sunday=0 … Saturday=6 — used for weekly. */
  readonly dayOfWeek: number;
  /** 1–28 — used for monthly (avoids short-month ambiguity). */
  readonly dayOfMonth: number;
  readonly customCron: string;
  readonly name: string;
  readonly nameTouched: boolean;
};

export const ADVISORY_SCHEDULE_FREQUENCY_OPTIONS: readonly {
  readonly value: AdvisoryScheduleFrequency;
  readonly label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

export const ADVISORY_SCHEDULE_DAY_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const ADVISORY_SCHEDULE_MINUTE_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = [
  { value: 0, label: ":00" },
  { value: 15, label: ":15" },
  { value: 30, label: ":30" },
  { value: 45, label: ":45" },
] as const;

export const ADVISORY_SCHEDULE_HOUR_OPTIONS = EXEC_DIGEST_HOUR_OPTIONS;

export const ADVISORY_SCHEDULE_DAY_OF_MONTH_OPTIONS: readonly {
  readonly value: number;
  readonly label: string;
}[] = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1;

  return { value: day, label: String(day) };
});

const DEFAULT_AUTHORITY_PROJECT_SLUG = "default";

export function createDefaultAdvisoryScheduleFormState(
  timeZoneId: string = resolveBrowserTimeZoneId(),
): AdvisoryScheduleFormState {
  return {
    frequency: "daily",
    hourOfDay: 7,
    minuteOfHour: 0,
    timeZoneId: toStoredIanaTimeZoneId(timeZoneId),
    dayOfWeek: 1,
    dayOfMonth: 1,
    customCron: "0 7 * * *",
    name: "",
    nameTouched: false,
  };
}

export function suggestedAdvisoryScheduleName(
  form: AdvisoryScheduleFormState,
  projectLabel: string,
): string {
  const project = projectLabel.trim().length > 0 ? projectLabel.trim() : "project";
  const freq =
    form.frequency === "daily"
      ? "Daily"
      : form.frequency === "weekdays"
        ? "Weekday"
        : form.frequency === "weekly"
          ? "Weekly"
          : form.frequency === "monthly"
            ? "Monthly"
            : "Custom";

  return `${freq} ${project} advisory scan`;
}

export function resolveAdvisoryScheduleName(
  form: AdvisoryScheduleFormState,
  projectLabel: string,
): string {
  if (form.nameTouched && form.name.trim().length > 0) {
    return form.name.trim();
  }

  if (form.name.trim().length > 0) {
    return form.name.trim();
  }

  return suggestedAdvisoryScheduleName(form, projectLabel);
}

/** Authority project key used by run listing — not a customer-facing slug field. */
export function resolveAdvisoryRunProjectSlug(scopeProjectId: string | null | undefined): string {
  const trimmed = scopeProjectId?.trim() ?? "";

  if (trimmed.length === 0) {
    return DEFAULT_AUTHORITY_PROJECT_SLUG;
  }

  // Pilot / demo reviews are listed under the authority project key "default".
  // Scope GUIDs are tenant routing ids, not run-list project keys.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return DEFAULT_AUTHORITY_PROJECT_SLUG;
  }

  return trimmed;
}

export function isAdvisoryScheduleFormReadyToCreate(form: AdvisoryScheduleFormState): boolean {
  if (form.frequency === "custom") {
    return form.customCron.trim().length > 0;
  }

  if (form.hourOfDay < 0 || form.hourOfDay > 23) {
    return false;
  }

  if (form.minuteOfHour < 0 || form.minuteOfHour > 59) {
    return false;
  }

  if (form.timeZoneId.trim().length === 0) {
    return false;
  }

  if (form.frequency === "weekly" && (form.dayOfWeek < 0 || form.dayOfWeek > 6)) {
    return false;
  }

  if (form.frequency === "monthly" && (form.dayOfMonth < 1 || form.dayOfMonth > 28)) {
    return false;
  }

  return true;
}
