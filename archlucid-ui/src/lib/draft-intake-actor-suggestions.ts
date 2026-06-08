import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

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

/**
 * Deterministic inferred-then-confirmed seed (ADR 0049) — not LLM-backed.
 * ArchLucid presents a pre-filled guess; the operator confirms or corrects in the editor.
 */
export function buildSuggestedActorSet(freeTextIntent: string): ActorSet {
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

  return { actors };
}

/** Marks every actor as operator-confirmed before admission patch (R4 transparency trail). */
export function assertActorSetForAdmission(actorSet: ActorSet): ActorSet {
  return {
    actors: actorSet.actors.map((actor) => ({
      ...actor,
      origin: "Asserted",
      confidence: 100,
    })),
  };
}
