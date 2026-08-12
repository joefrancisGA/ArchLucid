import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
} from "@/lib/guided-intake-copy";

const MIN_OUTCOME_CHARS = 10;

export type ArchitectureDraftFieldState = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
};

export type ArchitectureDraftValidationResult = {
  readonly isValid: boolean;
  readonly blockers: readonly string[];
};

/** True when the operator entered content worth a first server persist (deferred-create gate). */
export function hasArchitectureDraftSaveableContent(fields: ArchitectureDraftFieldState): boolean {
  const hasSystemName = fields.systemName.trim().length > 0;
  const hasOutcome = fields.businessOutcome.trim().length > 0;
  const hasIntent = fields.freeTextIntent.trim().length > 0;

  if (!hasSystemName && !hasOutcome && !hasIntent) {
    return false;
  }

  return validateArchitectureDraftIntegrity(fields).isValid;
}

export function validateArchitectureDraftIntegrity(
  fields: ArchitectureDraftFieldState,
): ArchitectureDraftValidationResult {
  const blockers: string[] = [];

  if (fields.freeTextIntent.trim().length > 0 && fields.freeTextIntent.trim().length < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    blockers.push("architecture overview format");
  }

  if (fields.businessOutcome.trim().length > 0 && fields.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    blockers.push("business outcome format");
  }

  return {
    isValid: blockers.length === 0,
    blockers,
  };
}

export function validateArchitectureReviewReadiness(
  fields: ArchitectureDraftFieldState,
): ArchitectureDraftValidationResult {
  const blockers: string[] = [];

  if (fields.systemName.trim().length === 0) {
    blockers.push("system name");
  }

  if (fields.freeTextIntent.trim().length < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    blockers.push("architecture overview");
  }

  if (fields.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    blockers.push("business outcome");
  }

  return {
    isValid: blockers.length === 0,
    blockers,
  };
}
