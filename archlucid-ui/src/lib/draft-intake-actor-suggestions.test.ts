import { describe, expect, it } from "vitest";

import {
  buildSuggestedActorSet,
  buildSuggestedActorsFromIntent,
  filterNewActorSuggestions,
  isIntentSufficientForActorSuggestions,
  normalizeActorSetForAdmission,
} from "./draft-intake-actor-suggestions";

describe("isIntentSufficientForActorSuggestions", () => {
  it("requires minimum intent length", () => {
    expect(isIntentSufficientForActorSuggestions("short")).toBe(false);
    expect(isIntentSufficientForActorSuggestions("long enough intent")).toBe(true);
  });
});

describe("buildSuggestedActorsFromIntent", () => {
  it("returns no suggestions when intent is too short", () => {
    expect(buildSuggestedActorsFromIntent("too short")).toEqual([]);
    expect(buildSuggestedActorSet("too short").actors).toEqual([]);
  });

  it("seeds one inferred internal human when intent is sufficient", () => {
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

describe("filterNewActorSuggestions", () => {
  it("excludes suggestions already present in the actor set", () => {
    const existing = buildSuggestedActorsFromIntent("Claims intake with partner API integration.");
    const suggestions = buildSuggestedActorsFromIntent("Claims intake with partner API integration.");

    expect(filterNewActorSuggestions(existing, suggestions)).toEqual([]);
  });
});

describe("normalizeActorSetForAdmission", () => {
  it("preserves inferred provenance for admission", () => {
    const normalized = normalizeActorSetForAdmission(buildSuggestedActorSet("intent long enough"));

    expect(normalized.actors.some((actor) => actor.origin === "Inferred")).toBe(true);
    expect(normalized.actors.every((actor) => actor.confidence <= 99)).toBe(true);
  });

  it("keeps asserted actors at full confidence", () => {
    const normalized = normalizeActorSetForAdmission({
      actors: [
        {
          label: "Ops admin",
          kind: "Human",
          trustOrigin: "Internal",
          contract: "Sync",
          origin: "Asserted",
          confidence: 100,
        },
      ],
    });

    expect(normalized.actors[0]).toMatchObject({
      origin: "Asserted",
      confidence: 100,
      label: "Ops admin",
    });
  });
});
