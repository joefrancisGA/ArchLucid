import { describe, expect, it } from "vitest";

import {
  QUICK_DECISION_FINDING_TITLE_NOT_STORED,
  resolveQuickDecisionFindingPresentation,
} from "@/lib/quick-decision-finding-wire-fields";

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

  it("uses explicit not-stored title when wire omits title and message", () => {
    const result = resolveQuickDecisionFindingPresentation({});

    expect(result.title).toBe(QUICK_DECISION_FINDING_TITLE_NOT_STORED);
    expect(result.recommendation).toBe("");
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
        message: "Port 22 is open",
        reasoningTrace: "Trace body.",
      }),
    ).toMatchObject({
      title: QUICK_DECISION_FINDING_TITLE_NOT_STORED,
      recommendation: "Port 22 is open",
    });
  });

  it("uses stored-empty title when wire title is whitespace only", () => {
    const result = resolveQuickDecisionFindingPresentation({
      title: "   ",
      message: "Port 22 is open",
    });

    expect(result.title).toBe("Finding title was stored empty.");
    expect(result.recommendation).toBe("Port 22 is open");
  });
});
