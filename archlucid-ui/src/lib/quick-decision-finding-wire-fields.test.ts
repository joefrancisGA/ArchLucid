import { describe, expect, it } from "vitest";

import { resolveQuickDecisionFindingPresentation } from "@/lib/quick-decision-finding-wire-fields";

describe("quick-decision-finding-wire-fields", () => {
  it("prefers title then message for the card title and uses message as recommendation when both exist", () => {
    const result = resolveQuickDecisionFindingPresentation({
      title: "Stored title",
      message: "Stored detail body.",
      reasoningTrace: "Trace only.",
    });

    expect(result.title).toBe("Stored title");
    expect(result.recommendation).toBe("Stored detail body.");
  });

  it("falls back through recommendedActions, rationale, and reasoningTrace for recommendation", () => {
    expect(
      resolveQuickDecisionFindingPresentation({
        title: "Title",
        recommendedActions: ["", "Rotate keys."],
      }).recommendation,
    ).toBe("Rotate keys.");

    expect(
      resolveQuickDecisionFindingPresentation({
        title: "Title",
        rationale: "Because exposure is public.",
      }).recommendation,
    ).toBe("Because exposure is public.");

    expect(
      resolveQuickDecisionFindingPresentation({
        message: "Only message",
        reasoningTrace: "Trace body.",
      }).recommendation,
    ).toBe("Trace body.");
  });

  it("returns omission copy when no recommendation fields are stored", () => {
    expect(
      resolveQuickDecisionFindingPresentation({
        title: "Title",
      }).recommendation,
    ).toBe("Recommended action was not stored.");
  });
});
