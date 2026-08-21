import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
} from "@/lib/guided-intake-copy";
import { buildDefaultActorSet } from "@/lib/api/draft-intake-api";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";

import type { ArchitectureReviewReadinessBlockerId } from "./architecture-review-readiness-copy";
import type { ArchitectureDraftStructuredBriefState } from "./architecture-draft-structured-brief";
import {
  hasConfirmedActor,
  qualityAttributeMeetsMinimum,
  structuredBriefToPatchPayload,
} from "./architecture-draft-structured-brief";
import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

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

export type ArchitectureDraftPatchPayload = {
  readonly freeTextIntent?: string;
  readonly businessOutcome: string;
  readonly systemName?: string;
  readonly actorSet: ActorSet;
  readonly workflowIntent: typeof CREATE_ARCHITECTURE_INTENT;
  readonly structuredBrief: ReturnType<typeof structuredBriefToPatchPayload>;
};

/**
 * PATCH body for `/v1/architecture/draft/{id}` while status is `Drafting`.
 * Omits `freeTextIntent` when empty or below server minimum so partial saves do not 400.
 */
export function buildArchitectureDraftPatchPayload(
  fields: ArchitectureDraftFieldState,
  actorSet: ActorSet,
): ArchitectureDraftPatchPayload {
  const trimmedIntent = fields.freeTextIntent.trim();
  const trimmedOutcome = fields.businessOutcome.trim();
  const trimmedSystemName = fields.systemName.trim();

  return {
    ...(trimmedIntent.length >= GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS
      ? { freeTextIntent: trimmedIntent }
      : {}),
    businessOutcome: trimmedOutcome,
    ...(trimmedSystemName.length > 0 ? { systemName: trimmedSystemName } : {}),
    actorSet: normalizeActorSetForAdmission(
      actorSet.actors.length > 0 ? actorSet : buildDefaultActorSet(),
    ),
    workflowIntent: CREATE_ARCHITECTURE_INTENT,
    structuredBrief: structuredBriefToPatchPayload(fields.structuredBrief),
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
