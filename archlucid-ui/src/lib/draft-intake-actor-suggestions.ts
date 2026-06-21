import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

/** Minimum intent length before deterministic actor suggestions are offered. */
export const MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS = 10;

/** Creates a blank actor row for the intake editor. */
export function createEmptyActorDescriptor(): ActorDescriptor {
  return {
    label: "",
    kind: "Human",
    trustOrigin: "Internal",
    contract: "Sync",
    origin: "Asserted",
    confidence: 100,
  };
}

function hasActorMatching(
  actors: ActorDescriptor[],
  kind: ActorDescriptor["kind"],
  trustOrigin: ActorDescriptor["trustOrigin"],
): boolean {
  return actors.some(
    (actor) => actor.kind === kind && actor.trustOrigin === trustOrigin,
  );
}

/** Stable key for deduplicating actor rows in the intake editor. */
export function actorIdentityKey(actor: ActorDescriptor): string {
  const label = actor.label?.trim().toLowerCase() ?? "";

  return `${actor.kind}|${actor.trustOrigin}|${actor.contract}|${label}`;
}

export function isIntentSufficientForActorSuggestions(
  freeTextIntent: string,
  minChars: number = MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS,
): boolean {
  return freeTextIntent.trim().length >= minChars;
}

/**
 * Deterministic actor suggestions (ADR 0049) — not LLM-backed.
 * Returns an empty list until intent meets the minimum length.
 */
export function buildSuggestedActorsFromIntent(freeTextIntent: string): ActorDescriptor[] {
  if (!isIntentSufficientForActorSuggestions(freeTextIntent)) {
    return [];
  }

  const actors: ActorDescriptor[] = [
    {
      label: "Primary internal user",
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Inferred",
      confidence: 70,
    },
  ];

  const lower = freeTextIntent.trim().toLowerCase();

  if (
    /\b(api|webhook|batch|machine|service|integration)\b/.test(lower)
    && !hasActorMatching(actors, "Machine", "External")
  ) {
    actors.push({
      label: "Machine integration",
      kind: "Machine",
      trustOrigin: "External",
      contract: "AsyncBatch",
      origin: "Inferred",
      confidence: 60,
    });
  }

  if (
    /\b(customer|public|anonymous|external user|partner)\b/.test(lower)
    && !hasActorMatching(actors, "Human", "External")
  ) {
    actors.push({
      label: "External user",
      kind: "Human",
      trustOrigin: "External",
      contract: "Sync",
      origin: "Inferred",
      confidence: 55,
    });
  }

  return actors;
}

/** @deprecated Prefer buildSuggestedActorsFromIntent — kept for callers that expect ActorSet. */
export function buildSuggestedActorSet(freeTextIntent: string): ActorSet {
  return { actors: buildSuggestedActorsFromIntent(freeTextIntent) };
}

/** Filters suggestions that are not already present in the confirmed actor set. */
export function filterNewActorSuggestions(
  existingActors: ActorDescriptor[],
  suggestions: ActorDescriptor[],
): ActorDescriptor[] {
  const existingKeys = new Set(existingActors.map((actor) => actorIdentityKey(actor)));

  return suggestions.filter((suggestion) => !existingKeys.has(actorIdentityKey(suggestion)));
}

/** Preserves asserted vs inferred provenance for admission patch (ADR 0050). */
export function normalizeActorSetForAdmission(actorSet: ActorSet): ActorSet {
  return {
    actors: actorSet.actors.map((actor) => ({
      ...actor,
      label: actor.label?.trim() || undefined,
      confidence: actor.origin === "Asserted" ? 100 : Math.min(99, Math.max(1, actor.confidence)),
    })),
  };
}
