import { isDevTestingOverridesEnabled } from "@/lib/dev-testing-overrides";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

/** Tab-scoped Practice pick for local development — cleared when the tab closes. */
export const LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY = "archlucid.local-dev.practice-door.v1";

/** Local `next dev` starts on Record; Practice is an explicit, session-only opt-in. */
export function isLocalDevRecordStartupEnabled(): boolean {
  return isDevTestingOverridesEnabled();
}

export function shouldBypassSampleWorkspaceRecordPin(): boolean {
  return isLocalDevRecordStartupEnabled();
}

export function readLocalDevPracticeSessionDoor(): WorkingCareerRehearsalDoorId | null {
  if (!isLocalDevRecordStartupEnabled() || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)?.trim().toLowerCase();

    if (raw === "rehearsal" || raw === "practice") {
      return "rehearsal";
    }

    if (raw === "career" || raw === "record") {
      return "career";
    }

    return null;
  }
  catch {
    return null;
  }
}

export function writeLocalDevPracticeSessionDoor(door: WorkingCareerRehearsalDoorId): void {
  if (!isLocalDevRecordStartupEnabled() || typeof window === "undefined") {
    return;
  }

  try {
    if (door === "rehearsal") {
      window.sessionStorage.setItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY, "rehearsal");

      return;
    }

    window.sessionStorage.removeItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY);
  }
  catch {
    /* private mode */
  }
}

/** Record unless this tab explicitly chose Practice in the current session. */
export function resolveLocalDevRecordStartupDoor(): WorkingCareerRehearsalDoorId {
  const sessionDoor = readLocalDevPracticeSessionDoor();

  if (sessionDoor === "rehearsal") {
    return "rehearsal";
  }

  return "career";
}
