import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

/** IH-025 / ADR 0091 — honesty before start; gate remains at finalize (CG-021). */
export const WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE =
  "Record is selected on a Simulator host. You can start here — this workspace cannot produce sealed-record-complete proof until Real execution is provisioned.";

export const WORKING_RECORD_SIMULATOR_START_HONESTY_TEST_ID =
  "working-record-simulator-start-honesty" as const;

export function shouldShowWorkingRecordSimulatorStartHonesty(input: {
  readonly workingMode: boolean;
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
  readonly isSessionReal: boolean;
}): boolean {
  if (!input.workingMode || input.selectedDoor !== "career") {
    return false;
  }

  return !input.isSessionReal;
}
