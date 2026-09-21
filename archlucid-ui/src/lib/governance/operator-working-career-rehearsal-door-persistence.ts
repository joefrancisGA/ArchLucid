import {
  isLocalDevRecordStartupEnabled,
  resolveLocalDevRecordStartupDoor,
  writeLocalDevPracticeSessionDoor,
} from "@/lib/governance/local-dev-record-startup";
import {
  readWorkingCareerRehearsalDoorFromStorage,
  writeWorkingCareerRehearsalDoorToStorage,
  type WorkingCareerRehearsalDoorId,
  type WorkingCareerRehearsalDoorScope,
} from "@/lib/governance/working-career-rehearsal-door";

/** Operator chrome read — local dev starts on Record with session-only Practice. */
export function readOperatorWorkingCareerRehearsalDoor(
  scope: WorkingCareerRehearsalDoorScope,
): WorkingCareerRehearsalDoorId {
  if (isLocalDevRecordStartupEnabled()) {
    return resolveLocalDevRecordStartupDoor();
  }

  return readWorkingCareerRehearsalDoorFromStorage(scope);
}

/** Operator chrome write — local dev keeps Practice in sessionStorage only. */
export function writeOperatorWorkingCareerRehearsalDoor(
  scope: WorkingCareerRehearsalDoorScope,
  door: WorkingCareerRehearsalDoorId,
): void {
  if (isLocalDevRecordStartupEnabled()) {
    writeLocalDevPracticeSessionDoor(door);

    return;
  }

  writeWorkingCareerRehearsalDoorToStorage(scope, door);
  writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, door);
}
