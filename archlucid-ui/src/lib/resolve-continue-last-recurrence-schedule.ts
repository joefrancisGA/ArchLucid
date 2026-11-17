import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

export const RECURRENCE_SCHEDULE_LAST_VIEWED_STORAGE_KEY = "archlucid_recurrence_schedule_continue_last_v1";

export type RecurrenceSchedulesContinueLastTarget = {
  readonly scheduleId: string;
  readonly name: string;
};

function readStoredScheduleId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(RECURRENCE_SCHEDULE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeRecurrenceScheduleLastViewedId(scheduleId: string): void {
  const normalized = scheduleId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECURRENCE_SCHEDULE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(schedule: ArchitectureReviewRecurrenceSchedule): RecurrenceSchedulesContinueLastTarget {
  return {
    scheduleId: schedule.scheduleId,
    name: schedule.name.trim().length > 0 ? schedule.name : "Recurrence schedule",
  };
}

function compareSoonestNextRun(
  left: ArchitectureReviewRecurrenceSchedule,
  right: ArchitectureReviewRecurrenceSchedule,
): number {
  const leftNext = parseIsoUtcMs(left.nextRunUtc ?? "");
  const rightNext = parseIsoUtcMs(right.nextRunUtc ?? "");
  const leftHasNext = !Number.isNaN(leftNext);
  const rightHasNext = !Number.isNaN(rightNext);

  if (leftHasNext && rightHasNext) {
    return leftNext - rightNext;
  }

  if (leftHasNext !== rightHasNext) {
    return leftHasNext ? -1 : 1;
  }

  const leftLast = parseIsoUtcMs(left.lastTriggeredUtc ?? "");
  const rightLast = parseIsoUtcMs(right.lastTriggeredUtc ?? "");
  if (Number.isNaN(leftLast)) return Number.isNaN(rightLast) ? 0 : 1;
  if (Number.isNaN(rightLast)) return -1;
  return rightLast - leftLast;
}

/** Resolves the recurrence schedule to pin as Continue last viewed. */
export function resolveContinueLastRecurrenceSchedule(
  schedules: unknown,
): RecurrenceSchedulesContinueLastTarget | null {
  const normalizedSchedules = asNonemptyReadonlyArray<ArchitectureReviewRecurrenceSchedule>(schedules);

  if (normalizedSchedules === null) {
    return null;
  }

  const validSchedules = normalizedSchedules.filter(
    (schedule) =>
      typeof schedule?.scheduleId === "string"
      && typeof schedule?.name === "string"
      && (schedule?.nextRunUtc == null || typeof schedule.nextRunUtc === "string")
      && (schedule?.lastTriggeredUtc == null || typeof schedule.lastTriggeredUtc === "string"),
  );

  if (validSchedules.length === 0) {
    return null;
  }

  const storedId = readStoredScheduleId();

  if (storedId !== null) {
    const storedMatch = validSchedules.find((schedule) => schedule.scheduleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const soonest = validSchedules.slice().sort(compareSoonestNextRun)[0];

  return soonest === undefined ? null : toTarget(soonest);
}
