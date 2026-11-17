import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
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

  const leftCreated = parseIsoUtcMs(left.createdUtc);
  const rightCreated = parseIsoUtcMs(right.createdUtc);
  if (Number.isNaN(leftCreated)) return Number.isNaN(rightCreated) ? 0 : 1;
  if (Number.isNaN(rightCreated)) return -1;
  return rightCreated - leftCreated;
}

/** Resolves the advisory schedule to pin as Continue last viewed. */
export function resolveContinueLastAdvisorySchedule(
  schedules: unknown,
): AdvisorySchedulesContinueLastTarget | null {
  const normalizedSchedules = asNonemptyReadonlyArray<AdvisoryScanSchedule>(schedules);

  if (normalizedSchedules === null) {
    return null;
  }

  const validSchedules = normalizedSchedules.filter(
    (schedule) =>
      typeof schedule?.scheduleId === "string"
      && typeof schedule?.name === "string"
      && typeof schedule?.createdUtc === "string"
      && (schedule?.nextRunUtc == null || typeof schedule?.nextRunUtc === "string"),
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
