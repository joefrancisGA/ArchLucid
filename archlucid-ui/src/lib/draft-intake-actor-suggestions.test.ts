import { describe, expect, it } from "vitest";

import {
  actorIdentityKey,
  buildSuggestedActorSet,
  buildSuggestedActorsFromIntent,
  filterNewActorSuggestions,
  isIntentSufficientForActorSuggestions,
  normalizeActorSetForAdmission,
} from "./draft-intake-actor-suggestions";
import type { ActorDescriptor } from "@/types/draft-intake";

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

describe("actorIdentityKey", () => {
  it("uses the ADR 0049 triple and ignores display labels", () => {
    expect(
      actorIdentityKey({
        label: "Primary operator",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Asserted",
        confidence: 100,
      }),
    ).toBe("Human|Internal|Sync");
    expect(
      actorIdentityKey({
        label: "Primary internal user",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Inferred",
        confidence: 70,
      }),
    ).toBe("Human|Internal|Sync");
  });
});

describe("filterNewActorSuggestions", () => {
  it("excludes suggestions already present in the actor set", () => {
    const existing = buildSuggestedActorsFromIntent("Claims intake with partner API integration.");
    const suggestions = buildSuggestedActorsFromIntent("Claims intake with partner API integration.");

    expect(filterNewActorSuggestions(existing, suggestions)).toEqual([]);
  });

  it("excludes suggestions that match an existing actor triple with a different label", () => {
    const existing: ActorDescriptor[] = [
      {
        label: "Primary operator",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Asserted",
        confidence: 100,
      },
    ];
    const suggestions = buildSuggestedActorsFromIntent("Customer portal with partner API integration.");

    expect(filterNewActorSuggestions(existing, suggestions)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "Machine", trustOrigin: "External" }),
        expect.objectContaining({ kind: "Human", trustOrigin: "External" }),
      ]),
    );
    expect(filterNewActorSuggestions(existing, suggestions)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Primary internal user" }),
      ]),
    );
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
