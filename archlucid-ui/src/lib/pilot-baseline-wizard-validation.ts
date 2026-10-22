function parsePositiveHours(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

function parsePeopleOrNull(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

export type PilotBaselineReviewStepValidation = {
  readonly valid: boolean;
  readonly hoursError: string | null;
  readonly noteError: string | null;
};

export type PilotBaselineManualStepValidation = {
  readonly valid: boolean;
  readonly prepError: string | null;
  readonly peopleError: string | null;
};

/** Step-one validity for the first-session pilot baseline overlay (TB-2007). */
export function validatePilotBaselineReviewStep(
  reviewHours: string,
  reviewNote: string,
): PilotBaselineReviewStepValidation {
  const hours = parsePositiveHours(reviewHours);
  let hoursError: string | null = null;

  if (Number.isNaN(hours)) {
    hoursError = "Median hours must be a positive number.";
  } else if (hours === null || hours <= 0 || hours > 10_000) {
    hoursError = "Median hours must be between 0 and 10,000 (exclusive of zero).";
  }

  let noteError: string | null = null;

  if (reviewNote.trim().length > 500) {
    noteError = "Notes must be 500 characters or fewer.";
  }

  return {
    valid: hoursError === null && noteError === null,
    hoursError,
    noteError,
  };
}

/** Step-two validity for the first-session pilot baseline overlay (TB-2007). */
export function validatePilotBaselineManualStep(
  manualPrep: string,
  people: string,
): PilotBaselineManualStepValidation {
  const prep = parsePositiveHours(manualPrep);
  let prepError: string | null = null;

  if (Number.isNaN(prep)) {
    prepError = "Manual preparation hours must be a positive number.";
  } else if (prep === null || prep <= 0 || prep > 10_000) {
    prepError = "Manual preparation hours must be between 0 and 10,000 (exclusive of zero).";
  }

  const peopleN = parsePeopleOrNull(people);
  let peopleError: string | null = null;

  if (Number.isNaN(peopleN)) {
    peopleError = "People per review must be a whole number (or leave blank).";
  } else if (peopleN !== null && (peopleN <= 0 || peopleN > 10_000 || !Number.isInteger(peopleN))) {
    peopleError = "People per review must be between 1 and 10,000 when set.";
  }

  return {
    valid: prepError === null && peopleError === null,
    prepError,
    peopleError,
  };
}
