import { describe, expect, it } from "vitest";

import {
  assertActorSetForAdmission,
  buildSuggestedActorSet,
} from "./draft-intake-actor-suggestions";

describe("buildSuggestedActorSet", () => {
  it("seeds one inferred internal human by default", () => {
    const actorSet = buildSuggestedActorSet("Build a workflow platform.");

    expect(actorSet.actors).toHaveLength(1);
    expect(actorSet.actors[0]).toMatchObject({
      kind: "Human",
      trustOrigin: "Internal",
      origin: "Inferred",
    });
  });

  it("adds machine and external actors when intent keywords match", () => {
    const actorSet = buildSuggestedActorSet(
      "Customer-facing portal with nightly batch API integration for partners.",
    );

    expect(actorSet.actors.length).toBeGreaterThanOrEqual(2);
    expect(actorSet.actors.some((actor) => actor.kind === "Machine")).toBe(true);
    expect(actorSet.actors.some((actor) => actor.trustOrigin === "External")).toBe(true);
  });
});

describe("assertActorSetForAdmission", () => {
  it("marks all actors asserted before admission", () => {
    const asserted = assertActorSetForAdmission(buildSuggestedActorSet("intent"));

    expect(asserted.actors.every((actor) => actor.origin === "Asserted")).toBe(true);
    expect(asserted.actors.every((actor) => actor.confidence === 100)).toBe(true);
  });
});
