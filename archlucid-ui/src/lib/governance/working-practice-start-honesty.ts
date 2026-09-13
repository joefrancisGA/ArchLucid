import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import { WORKING_REHEARSAL_DOOR_LABEL } from "@/lib/governance/working-career-rehearsal-door-copy";

/** IH-026 / ADR 0097 — Practice cannot screenshot as Record-complete before spawn. */
export const WORKING_PRACTICE_START_HONESTY_SENTENCE =
  `${WORKING_REHEARSAL_DOOR_LABEL} is selected. This run stays rehearsal-stamped — screenshots cannot read as Record-complete before you start.`;

export const WORKING_PRACTICE_START_HONESTY_TEST_ID = "working-practice-start-honesty" as const;

export function shouldShowWorkingPracticeStartHonesty(input: {
  readonly workingMode: boolean;
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
}): boolean {
  if (!input.workingMode || input.selectedDoor !== "rehearsal") {
    return false;
  }

  return true;
}
