import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  type WorkingCareerRehearsalDoorId,
  WORKING_CAREER_REHEARSAL_DOOR_IDS,
} from "@/lib/governance/working-career-rehearsal-door";

function isWorkingCareerRehearsalDoorId(value: string): value is WorkingCareerRehearsalDoorId {
  return (WORKING_CAREER_REHEARSAL_DOOR_IDS as readonly string[]).includes(value);
}

/**
 * CG-019: Career honesty reads the execute-start stamp when present.
 * The live chooser can move later; a Rehearsal execute must not later look like Career.
 */
export function resolveHonestyWorkingCareerRehearsalDoor(input: {
  readonly stampedDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
}): WorkingCareerRehearsalDoorId {
  const stamped = typeof input.stampedDoor === "string" ? input.stampedDoor.trim().toLowerCase() : "";

  if (isWorkingCareerRehearsalDoorId(stamped)) {
    return stamped;
  }

  if (input.liveDoor === "career" || input.liveDoor === "rehearsal") {
    return input.liveDoor;
  }

  return DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;
}
