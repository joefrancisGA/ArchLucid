import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
} from "@/lib/guided-intake-copy";
import { buildDefaultActorSet } from "@/lib/api/draft-intake-api";
import { isArchitectureCreationBootstrapIntent } from "@/lib/architecture/architecture-creation-bootstrap";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import {
  mergeScopeBulletsIntoBrief,
  stripScopeUnderstandingSection,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";

import type { ArchitectureReviewReadinessBlockerId } from "./architecture-review-readiness-copy";
import type { ArchitectureDraftStructuredBriefState } from "./architecture-draft-structured-brief";
import {
  hasConfirmedActor,
  hasUnconfirmedStructuredBriefPlaceholders,
  structuredBriefFromDocument,
  structuredBriefToPatchPayload,
} from "./architecture-draft-structured-brief";
import type { ActorDescriptor, ActorSet, DraftRequestResponse } from "@/types/draft-intake";

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
  readonly expectedUpdatedUtc?: string;
  readonly forceOverwrite?: boolean;
};

/**
 * PATCH body for `/v1/architecture/draft/{id}` while status is `Drafting`.
 * Omits `freeTextIntent` when empty or below server minimum so partial saves do not 400.
 */
export function buildArchitectureDraftPatchPayload(
  fields: ArchitectureDraftFieldState,
  actorSet: ActorSet,
  confirmedScopeBullets?: readonly ScopeUnderstandingBullet[],
): ArchitectureDraftPatchPayload {
  const strippedIntent = fields.freeTextIntent.trim();
  const intentForPatch =
    confirmedScopeBullets !== undefined && confirmedScopeBullets.length > 0
      ? mergeScopeBulletsIntoBrief(confirmedScopeBullets, strippedIntent).trim()
      : strippedIntent;
  const trimmedOutcome = fields.businessOutcome.trim();
  const trimmedSystemName = fields.systemName.trim();

  return {
    ...(intentForPatch.length >= GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS
      ? { freeTextIntent: intentForPatch }
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

/** Maps a persisted draft document to workspace field state for readiness checks. */
export function architectureDraftFieldsFromDocument(draft: DraftRequestResponse): ArchitectureDraftFieldState {
  const bootstrapIntent = isArchitectureCreationBootstrapIntent(draft.document.freeTextIntent);

  // Drafts saved before the scope block moved out of the form fields can still carry it inline.
  return {
    freeTextIntent: bootstrapIntent
      ? ""
      : stripScopeUnderstandingSection(draft.document.freeTextIntent),
    businessOutcome: stripScopeUnderstandingSection(draft.document.businessOutcome ?? ""),
    systemName: draft.document.systemName ?? "",
    structuredBrief: structuredBriefFromDocument(draft.document),
  };
}

export function reviewReadinessFromDraftDocument(draft: DraftRequestResponse): ArchitectureDraftValidationResult {
  const fields = architectureDraftFieldsFromDocument(draft);
  const actors =
    draft.document.actorSet.actors.length > 0
      ? draft.document.actorSet.actors
      : buildDefaultActorSet().actors;

  return validateArchitectureReviewReadiness(fields, actors);
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

  if (hasUnconfirmedStructuredBriefPlaceholders(fields.structuredBrief)) {
    blockers.push("structured-brief-placeholders");
  }

  return {
    isValid: blockers.length === 0,
    blockers,
  };
}
