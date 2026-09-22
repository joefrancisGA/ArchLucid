import {
  parseWorkingCareerRehearsalDoorId,
  readWorkingCareerRehearsalDoorFromStorage,
  tryReadExplicitWorkingCareerRehearsalDoorFromStorage,
  writeWorkingCareerRehearsalDoorToStorage,
  type WorkingCareerRehearsalDoorId,
  type WorkingCareerRehearsalDoorScope,
} from "@/lib/governance/working-career-rehearsal-door";

export type ResolveWorkingCareerRehearsalDoorFromServerAndInterruptInput = {
  readonly serverDoor?: string | null;
  readonly serverIsExplicit: boolean;
  readonly interruptDoor: WorkingCareerRehearsalDoorId | null;
  readonly implicitDefault: WorkingCareerRehearsalDoorId;
};

/** Server explicit pick wins; localStorage is interrupt recovery only (CG-011). */
export function resolveWorkingCareerRehearsalDoorFromServerAndInterrupt(
  input: ResolveWorkingCareerRehearsalDoorFromServerAndInterruptInput,
): WorkingCareerRehearsalDoorId {
  if (input.serverIsExplicit) {
    return parseWorkingCareerRehearsalDoorId(input.serverDoor);
  }

  if (input.interruptDoor !== null) {
    return input.interruptDoor;
  }

  return input.implicitDefault;
}

function writeInterruptCache(scope: WorkingCareerRehearsalDoorScope, door: WorkingCareerRehearsalDoorId): void {
  writeWorkingCareerRehearsalDoorToStorage(scope, door);
  writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, door);
}

export async function persistWorkingCareerRehearsalDoorToServer(
  door: WorkingCareerRehearsalDoorId,
): Promise<boolean> {
  try {
    const { setUserWorkingCareerRehearsalDoor } = await import("@/lib/api/user-preferences");
    await setUserWorkingCareerRehearsalDoor(door);

    return true;
  } catch {
    return false;
  }
}

/**
 * Working-only: overlay the account door from GET. When the server has no explicit row, an existing
 * localStorage pick is migrated once so a later browser can replay it. Guided callers must not invoke this.
 */
export async function syncWorkingCareerRehearsalDoorFromServer(
  scope: WorkingCareerRehearsalDoorScope,
): Promise<WorkingCareerRehearsalDoorId | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const interruptDoor = tryReadExplicitWorkingCareerRehearsalDoorFromStorage(scope);
    const implicitDefault = readWorkingCareerRehearsalDoorFromStorage(scope);
    const resolved = resolveWorkingCareerRehearsalDoorFromServerAndInterrupt({
      serverDoor: remote.workingCareerRehearsalDoor,
      serverIsExplicit: remote.workingCareerRehearsalDoorIsExplicit === true,
      interruptDoor,
      implicitDefault,
    });

    if (remote.workingCareerRehearsalDoorIsExplicit === true) {
      writeInterruptCache(scope, resolved);

      return resolved;
    }

    if (interruptDoor !== null) {
      await persistWorkingCareerRehearsalDoorToServer(interruptDoor);

      return interruptDoor;
    }

    return null;
  } catch {
    return null;
  }
}
