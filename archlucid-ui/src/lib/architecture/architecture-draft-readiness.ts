import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
} from "@/lib/guided-intake-copy";

import type { ArchitectureReviewReadinessBlockerId } from "./architecture-review-readiness-copy";
import type { ArchitectureDraftStructuredBriefState } from "./architecture-draft-structured-brief";
import {
  hasConfirmedActor,
  listHasConfirmedEntry,
  qualityAttributeMeetsMinimum,
} from "./architecture-draft-structured-brief";
import type { ActorDescriptor } from "@/types/draft-intake";

const MIN_OUTCOME_CHARS = 10;

export type ArchitectureDraftFieldState = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
};

export type ArchitectureDraftValidationResult = {
  readonly isValid: boolean;
  readonly blockers: readonly ArchitectureReviewReadinessBlockerId[];
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
  const blockers: ArchitectureReviewReadinessBlockerId[] = [];

  if (fields.freeTextIntent.trim().length > 0 && fields.freeTextIntent.trim().length < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    blockers.push("architecture-overview");
  }

  if (fields.businessOutcome.trim().length > 0 && fields.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    blockers.push("business-outcome");
  }

  return {
    isValid: blockers.length === 0,
    blockers,
  };
}

export function validateArchitectureReviewReadiness(
  fields: ArchitectureDraftFieldState,
  actors: readonly ActorDescriptor[] = [],
): ArchitectureDraftValidationResult {
  const blockers: ArchitectureReviewReadinessBlockerId[] = [];

  if (fields.systemName.trim().length === 0) {
    blockers.push("system-name");
  }

  if (fields.freeTextIntent.trim().length < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
    blockers.push("architecture-overview");
  }

  if (fields.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    blockers.push("business-outcome");
  }

  if (!listHasConfirmedEntry(fields.structuredBrief.confirmedConstraints)) {
    blockers.push("constraints");
  }

  if (!listHasConfirmedEntry(fields.structuredBrief.confirmedAssumptions)) {
    blockers.push("assumptions");
  }

  if (!hasConfirmedActor(actors)) {
    blockers.push("confirmed-actor");
  }

  if (!qualityAttributeMeetsMinimum(fields.structuredBrief.qualityAttribute)) {
    blockers.push("quality-attributes");
  }

  return {
    isValid: blockers.length === 0,
    blockers,
  };
}
