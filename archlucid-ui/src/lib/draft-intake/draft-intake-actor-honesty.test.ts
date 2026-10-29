import { describe, expect, it } from "vitest";

import {
  DRAFT_INTAKE_ACTOR_INTERACTION_NOT_CHOSEN_LABEL,
  DRAFT_INTAKE_ACTOR_KIND_NOT_CHOSEN_LABEL,
  DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL,
  DRAFT_INTAKE_ACTOR_TRUST_ORIGIN_NOT_CHOSEN_LABEL,
  DRAFT_INTAKE_REDIRECT_REASON_NOT_STORED_LABEL,
  DRAFT_INTAKE_SYSTEM_NAME_NOT_STORED_LABEL,
  GENERATED_BRIEF_BUSINESS_OUTCOME_NOT_STORED_LABEL,
  buildMissingDraftActorsPlaceholderSet,
  formatDraftIntakeRedirectReasonForDisplay,
  formatDraftIntakeVerdictSummaryForDisplay,
  DRAFT_INTAKE_VERDICT_SUMMARY_NOT_STORED_LABEL,
  formatDraftIntakeSystemNameForDisplay,
  formatGeneratedBriefBusinessOutcomeForDisplay,
  isDraftIntakeActorAxisUnset,
} from "@/lib/draft-intake/draft-intake-actor-honesty";
import { createEmptyActorDescriptor } from "@/lib/draft-intake-actor-suggestions";

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

  it("formats empty redirect reason and system name on decision receipts", () => {
    expect(formatDraftIntakeRedirectReasonForDisplay("")).toBe(DRAFT_INTAKE_REDIRECT_REASON_NOT_STORED_LABEL);
    expect(formatDraftIntakeSystemNameForDisplay("  ")).toBe(DRAFT_INTAKE_SYSTEM_NAME_NOT_STORED_LABEL);
  });

  it("formats missing verdict summary on decision receipts", () => {
    expect(formatDraftIntakeVerdictSummaryForDisplay(undefined)).toBe(
      DRAFT_INTAKE_VERDICT_SUMMARY_NOT_STORED_LABEL,
    );
    expect(formatDraftIntakeVerdictSummaryForDisplay("   ")).toBe("Verdict summary was stored empty.");
  });

  it("treats a fresh manual actor row as unset on all axes", () => {
    expect(isDraftIntakeActorAxisUnset(createEmptyActorDescriptor())).toBe(true);
    expect(DRAFT_INTAKE_ACTOR_KIND_NOT_CHOSEN_LABEL).toBe("Kind was not chosen.");
    expect(DRAFT_INTAKE_ACTOR_TRUST_ORIGIN_NOT_CHOSEN_LABEL).toBe("Trust origin was not chosen.");
    expect(DRAFT_INTAKE_ACTOR_INTERACTION_NOT_CHOSEN_LABEL).toBe("Interaction was not chosen.");
  });
});
