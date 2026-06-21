import { describe, expect, it } from "vitest";

import {
  formatActorCardHeading,
  formatSuggestedActorLabel,
  getInteractionContractOptions,
} from "@/lib/draft-intake-actor-labels";
import type { ActorDescriptor } from "@/types/draft-intake";

const sampleActor: ActorDescriptor = {
  label: "Primary internal user",
  kind: "Human",
  trustOrigin: "Internal",
  contract: "Sync",
  origin: "Inferred",
  confidence: 70,
};

describe("formatActorCardHeading", () => {
  it("uses actor label and suggested provenance when inferred", () => {
    expect(formatActorCardHeading(sampleActor, 0)).toBe("Actor: Primary internal user — suggested");
  });

  it("falls back to numbering when label is empty", () => {
    expect(formatActorCardHeading({ ...sampleActor, label: "" }, 1)).toBe("Actor 2 — suggested");
  });

  it("omits suggested suffix when actor is confirmed", () => {
    expect(formatActorCardHeading({ ...sampleActor, origin: "Asserted" }, 0)).toBe(
      "Actor: Primary internal user",
    );
  });
});

describe("formatSuggestedActorLabel", () => {
  it("prefers the actor label in suggestion checkboxes", () => {
    expect(formatSuggestedActorLabel(sampleActor)).toBe("Primary internal user");
  });
});

describe("getInteractionContractOptions", () => {
  it("scopes sync labels by actor kind", () => {
    expect(getInteractionContractOptions("Human").find((option) => option.value === "Sync")?.label).toBe(
      "Interactive UI (synchronous)",
    );
    expect(getInteractionContractOptions("Machine").find((option) => option.value === "Sync")?.label).toBe(
      "Synchronous API",
    );
  });
});
