import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

/** IH-031 — never imply Ready / career-complete on the in-flight desk chip. */
export const INHABIT_IN_FLIGHT_DESK_CHIP_SIMULATOR_HOST_SUFFIX = "Simulator host" as const;

export const INHABIT_IN_FLIGHT_DESK_CHIP_REAL_HOST_SUFFIX = "Real host" as const;

export const INHABIT_IN_FLIGHT_DESK_CHIP_DETAIL_LINE =
  "Analysis runs in the background — open Activity on the child review. Not ready to seal while analysis is in flight." as const;

export type ResolveInhabitInFlightDeskChipStampInput = {
  readonly workingMode: boolean;
  readonly door: WorkingCareerRehearsalDoorId;
  readonly isSessionReal: boolean;
};

export function resolveInhabitInFlightDeskDoorLabel(door: WorkingCareerRehearsalDoorId): string {
  return door === "career" ? WORKING_CAREER_DOOR_LABEL : WORKING_REHEARSAL_DOOR_LABEL;
}

export function resolveInhabitInFlightDeskHostSuffix(isSessionReal: boolean): string {
  return isSessionReal
    ? INHABIT_IN_FLIGHT_DESK_CHIP_REAL_HOST_SUFFIX
    : INHABIT_IN_FLIGHT_DESK_CHIP_SIMULATOR_HOST_SUFFIX;
}

/** Record · Simulator host / Practice · Simulator host — no percentComplete, no Ready. */
export function resolveInhabitInFlightDeskChipStamp(
  input: ResolveInhabitInFlightDeskChipStampInput,
): string | null {
  if (!input.workingMode) {
    return null;
  }

  const doorLabel = resolveInhabitInFlightDeskDoorLabel(input.door);
  const hostSuffix = resolveInhabitInFlightDeskHostSuffix(input.isSessionReal);

  return `${doorLabel} · ${hostSuffix}`;
}
