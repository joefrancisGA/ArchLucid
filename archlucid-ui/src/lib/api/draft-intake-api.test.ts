import { describe, expect, it } from "vitest";

import { buildDefaultActorSet } from "./draft-intake-api";

describe("buildDefaultActorSet", () => {
  it("returns one asserted human actor for structural admission", () => {
    const actorSet = buildDefaultActorSet();

    expect(actorSet.actors).toHaveLength(1);
    expect(actorSet.actors[0]).toMatchObject({
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Asserted",
      confidence: 100,
    });
  });
});
