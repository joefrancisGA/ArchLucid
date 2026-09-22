import {
  DEFAULT_WORKING_CAREER_REHEARSAL_INTENT,
  parseWorkingCareerRehearsalIntent,
  type WorkingCareerRehearsalIntentId,
} from "@/lib/governance/working-career-rehearsal-intent";

const STORAGE_KEY = "archlucid.workingCareerRehearsalIntent.v1";

export function readWorkingCareerRehearsalIntentFromStorage(): WorkingCareerRehearsalIntentId {
  if (typeof window === "undefined") {
    return DEFAULT_WORKING_CAREER_REHEARSAL_INTENT;
  }

  try {
    return parseWorkingCareerRehearsalIntent(window.localStorage.getItem(STORAGE_KEY));
  }
  catch {
    return DEFAULT_WORKING_CAREER_REHEARSAL_INTENT;
  }
}

export function writeWorkingCareerRehearsalIntentToStorage(intent: WorkingCareerRehearsalIntentId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, intent);
}

/** AS-080: first-run Working defaults to Career intent; existing stored Rehearsal is grandfathered. */
export function resolveInitialWorkingCareerRehearsalIntent(input: {
  readonly storedIntent?: WorkingCareerRehearsalIntentId | null;
  readonly hasStoredPreference?: boolean;
}): WorkingCareerRehearsalIntentId {
  if (input.hasStoredPreference === true && input.storedIntent !== null && input.storedIntent !== undefined) {
    return input.storedIntent;
  }

  return DEFAULT_WORKING_CAREER_REHEARSAL_INTENT;
}
