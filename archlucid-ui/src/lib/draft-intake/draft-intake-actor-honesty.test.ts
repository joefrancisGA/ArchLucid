import { describe, expect, it } from "vitest";

import {
  DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL,
  GENERATED_BRIEF_BUSINESS_OUTCOME_NOT_STORED_LABEL,
  buildMissingDraftActorsPlaceholderSet,
  formatGeneratedBriefBusinessOutcomeForDisplay,
} from "@/lib/draft-intake/draft-intake-actor-honesty";

describe("draft-intake-actor-honesty", () => {
  it("uses inferred placeholder actor without Primary operator asserted 100", () => {
    const actorSet = buildMissingDraftActorsPlaceholderSet();

    expect(actorSet.actors[0]?.label).toBe(DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL);
    expect(actorSet.actors[0]?.origin).toBe("Inferred");
    expect(actorSet.actors[0]?.confidence).toBe(70);
  });

  it("formats empty generated-brief outcome as not stored", () => {
    expect(formatGeneratedBriefBusinessOutcomeForDisplay("")).toBe(
      GENERATED_BRIEF_BUSINESS_OUTCOME_NOT_STORED_LABEL,
    );
    expect(formatGeneratedBriefBusinessOutcomeForDisplay("Ship faster")).toBe("Ship faster");
  });
});
