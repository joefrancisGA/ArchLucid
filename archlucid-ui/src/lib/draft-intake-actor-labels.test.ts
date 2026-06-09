import { describe, expect, it } from "vitest";

import { formatActorCardHeading } from "@/lib/draft-intake-actor-labels";
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
  it("uses User type label when actor label is set", () => {
    expect(formatActorCardHeading(sampleActor, 0)).toBe("User type: Primary internal user");
  });

  it("falls back to suggested numbering when label is empty", () => {
    expect(formatActorCardHeading({ ...sampleActor, label: "" }, 1)).toBe("User type 2 — suggested");
  });
});
