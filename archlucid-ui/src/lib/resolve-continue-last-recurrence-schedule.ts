import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";

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
  const leftNext = left.nextRunUtc?.trim() ?? "";
  const rightNext = right.nextRunUtc?.trim() ?? "";

  if (leftNext.length > 0 && rightNext.length > 0) {
    return leftNext.localeCompare(rightNext);
  }

  if (leftNext.length > 0) {
    return -1;
  }

  if (rightNext.length > 0) {
    return 1;
  }

  const leftLast = left.lastTriggeredUtc?.trim() ?? "";
  const rightLast = right.lastTriggeredUtc?.trim() ?? "";

  return rightLast.localeCompare(leftLast);
}

/** Resolves the recurrence schedule to pin as Continue last viewed. */
export function resolveContinueLastRecurrenceSchedule(
  schedules: readonly ArchitectureReviewRecurrenceSchedule[],
): RecurrenceSchedulesContinueLastTarget | null {
  if (schedules.length === 0) {
    return null;
  }

  const storedId = readStoredScheduleId();

  if (storedId !== null) {
    const storedMatch = schedules.find((schedule) => schedule.scheduleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const soonest = schedules.slice().sort(compareSoonestNextRun)[0];

  return soonest === undefined ? null : toTarget(soonest);
}
