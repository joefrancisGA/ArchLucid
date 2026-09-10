export const WORKING_CAREER_REHEARSAL_INTENT_IDS = ["career", "rehearsal"] as const;

export type WorkingCareerRehearsalIntentId = (typeof WORKING_CAREER_REHEARSAL_INTENT_IDS)[number];

export const DEFAULT_WORKING_CAREER_REHEARSAL_INTENT: WorkingCareerRehearsalIntentId = "career";

export const WORKING_CAREER_REHEARSAL_INTENT_LABELS: Record<WorkingCareerRehearsalIntentId, string> = {
  career: "Career",
  rehearsal: "Rehearsal",
};

export function parseWorkingCareerRehearsalIntent(
  value: string | null | undefined,
): WorkingCareerRehearsalIntentId {
  if (value === null || value === undefined) {
    return DEFAULT_WORKING_CAREER_REHEARSAL_INTENT;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "rehearsal") {
    return "rehearsal";
  }

  if (trimmed === "career") {
    return "career";
  }

  return DEFAULT_WORKING_CAREER_REHEARSAL_INTENT;
}

export function isWorkingCareerIntent(intent: WorkingCareerRehearsalIntentId): boolean {
  return intent === "career";
}

export function isWorkingRehearsalIntent(intent: WorkingCareerRehearsalIntentId): boolean {
  return intent === "rehearsal";
}
