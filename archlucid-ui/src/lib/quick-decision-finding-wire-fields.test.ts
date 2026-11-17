import { describe, expect, it } from "vitest";

import {
  QUICK_DECISION_FINDING_MESSAGE_STORED_EMPTY,
  QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED,
  QUICK_DECISION_FINDING_TITLE_NOT_STORED,
  resolveQuickDecisionFindingPresentation,
} from "@/lib/quick-decision-finding-wire-fields";
import {
  formatQuickDecisionFindingMessageDisplay,
  QUICK_DECISION_FINDING_MESSAGE_NOT_STORED,
} from "@/lib/quick-decision-finding-links";

describe("quick-decision-finding-wire-fields", () => {
  it("prefers title then message for the card title and keeps message separate from recommendation", () => {
    const result = resolveQuickDecisionFindingPresentation({
      title: "Stored title",
      message: "Stored detail body.",
      recommendedActions: ["Rotate keys."],
    });

    expect(result.title).toBe("Stored title");
    expect(result.findingMessage).toBe("Stored detail body.");
    expect(result.recommendation).toBe("Rotate keys.");
  });

  it("uses explicit not-stored title when wire omits title and message", () => {
    const result = resolveQuickDecisionFindingPresentation({});

    expect(result.title).toBe(QUICK_DECISION_FINDING_TITLE_NOT_STORED);
    expect(result.recommendation).toBe(QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED);
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
      findingMessage: "Port 22 is open",
      recommendation: "Trace body.",
    });
  });

  it("uses stored-empty title when wire title is whitespace only", () => {
    const result = resolveQuickDecisionFindingPresentation({
      title: "   ",
      message: "Port 22 is open",
    });

    expect(result.title).toBe("Finding title was stored empty.");
    expect(result.findingMessage).toBe("Port 22 is open");
    expect(result.recommendation).toBe(QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED);
  });

  it("formats finding message display copy for omission and stored-empty", () => {
    expect(formatQuickDecisionFindingMessageDisplay("")).toBe(QUICK_DECISION_FINDING_MESSAGE_NOT_STORED);
    expect(formatQuickDecisionFindingMessageDisplay("   ")).toBe(QUICK_DECISION_FINDING_MESSAGE_STORED_EMPTY);
    expect(formatQuickDecisionFindingMessageDisplay("Body")).toBe("Body");
  });

  it("uses stored-empty message copy when wire message is whitespace only", () => {
    const result = resolveQuickDecisionFindingPresentation({
      title: "Title",
      message: "   ",
    });

    expect(result.recommendation).toBe(QUICK_DECISION_FINDING_RECOMMENDATION_NOT_STORED);
  });

  it("returns omission copy when no recommendation fields are stored", () => {
    expect(
      resolveQuickDecisionFindingPresentation({
        title: "Title",
      }).recommendation,
    ).toBe("Recommended action was not stored.");
  });
});
