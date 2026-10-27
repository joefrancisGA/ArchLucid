import { describe, expect, it } from "vitest";

import { DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL } from "@/lib/draft-intake/draft-intake-actor-honesty";

import { buildDefaultActorSet } from "./draft-intake-api";

describe("buildDefaultActorSet", () => {
  it("returns one inferred placeholder when intake omitted actor names", () => {
    const actorSet = buildDefaultActorSet();

    expect(actorSet.actors).toHaveLength(1);
    expect(actorSet.actors[0]).toMatchObject({
      label: DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL,
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Inferred",
      confidence: 70,
    });
  });
});
