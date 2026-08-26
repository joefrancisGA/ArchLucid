import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import type { AdvisoryScanSchedule } from "@/types/advisory-scheduling";

export const ADVISORY_SCHEDULE_LAST_VIEWED_STORAGE_KEY = "archlucid_advisory_schedule_continue_last_v1";

export type AdvisorySchedulesContinueLastTarget = {
  readonly scheduleId: string;
  readonly name: string;
};

function readStoredScheduleId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(ADVISORY_SCHEDULE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeAdvisoryScheduleLastViewedId(scheduleId: string): void {
  const normalized = scheduleId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ADVISORY_SCHEDULE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(schedule: AdvisoryScanSchedule): AdvisorySchedulesContinueLastTarget {
  return {
    scheduleId: schedule.scheduleId,
    name: schedule.name.trim().length > 0 ? schedule.name : "Advisory scan schedule",
  };
}

function compareSoonestNextRun(left: AdvisoryScanSchedule, right: AdvisoryScanSchedule): number {
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

  return right.createdUtc.localeCompare(left.createdUtc);
}

/** Resolves the advisory schedule to pin as Continue last viewed. */
export function resolveContinueLastAdvisorySchedule(
  schedules: unknown,
): AdvisorySchedulesContinueLastTarget | null {
  const normalizedSchedules = asNonemptyReadonlyArray<AdvisoryScanSchedule>(schedules);

  if (normalizedSchedules === null) {
    return null;
  }

  const storedId = readStoredScheduleId();

  if (storedId !== null) {
    const storedMatch = normalizedSchedules.find((schedule) => schedule.scheduleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const soonest = normalizedSchedules.slice().sort(compareSoonestNextRun)[0];

  return soonest === undefined ? null : toTarget(soonest);
}
