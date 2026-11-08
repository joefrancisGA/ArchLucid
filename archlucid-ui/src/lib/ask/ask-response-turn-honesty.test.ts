import { describe, expect, it } from "vitest";

import {
  ASK_ANSWER_NOT_STORED_LABEL,
  ASK_ANSWER_STORED_EMPTY_LABEL,
  FINDING_ASK_SOURCES_STORED_EMPTY_LABEL,
  REVIEW_ASK_ARTIFACT_CITATIONS_STORED_EMPTY_LABEL,
  REVIEW_ASK_FINDING_CITATIONS_NOT_STORED_LABEL,
  REVIEW_ASK_SOURCES_NOT_STORED_LABEL,
  REVIEW_ASK_SOURCES_STORED_EMPTY_LABEL,
  askWireCitationRefsOmitted,
  askWireCitationRefsPresentInWire,
  askWireCitationRefsStoredEmpty,
  findingAskSourcesHonestyLabel,
  normalizeAskWireAnswerForTurn,
  resolveAskWireAnswerState,
  reviewAskPerListSourceHonestyLabels,
  reviewAskSourcesHonestyLabel,
} from "./ask-response-turn-honesty";

describe("ask-response-turn-honesty", () => {
  it("distinguishes omitted, stored-empty, and content answers", () => {
    expect(resolveAskWireAnswerState(null)).toBe("not-stored");
    expect(resolveAskWireAnswerState(undefined)).toBe("not-stored");
    expect(resolveAskWireAnswerState("   ")).toBe("stored-empty");
    expect(resolveAskWireAnswerState("Stored answer")).toBe("content");

    expect(normalizeAskWireAnswerForTurn(null)).toBeNull();
    expect(normalizeAskWireAnswerForTurn("")).toBe("");
    expect(normalizeAskWireAnswerForTurn("  ")).toBe("");
    expect(normalizeAskWireAnswerForTurn("  hello ")).toBe("hello");
  });

  it("labels review ask sources as omitted vs stored empty vs present", () => {
    const omitted = {
      referencedFindings: null,
      referencedDecisions: null,
      referencedArtifacts: null,
    };

    expect(askWireCitationRefsOmitted(omitted)).toBe(true);
    expect(reviewAskSourcesHonestyLabel(omitted)).toBe(REVIEW_ASK_SOURCES_NOT_STORED_LABEL);

    const storedEmpty = {
      referencedFindings: [],
      referencedDecisions: [],
      referencedArtifacts: [],
    };

    expect(askWireCitationRefsStoredEmpty(storedEmpty)).toBe(true);
    expect(reviewAskSourcesHonestyLabel(storedEmpty)).toBe(REVIEW_ASK_SOURCES_STORED_EMPTY_LABEL);

    const present = {
      referencedFindings: ["finding-1"],
      referencedDecisions: [],
      referencedArtifacts: [],
    };

    expect(askWireCitationRefsPresentInWire(present)).toBe(true);
    expect(reviewAskSourcesHonestyLabel(present)).toBe(
      "Ask cited decisions were stored empty on this answer. Ask cited artifacts were stored empty on this answer.",
    );

    expect(
      askWireCitationRefsStoredEmpty({
        referencedFindings: null,
        referencedDecisions: [],
        referencedArtifacts: [],
      }),
    ).toBe(true);

    expect(
      askWireCitationRefsPresentInWire({
        referencedFindings: null,
        referencedDecisions: ["decision-1"],
        referencedArtifacts: undefined,
      }),
    ).toBe(true);
  });

  it("uses finding-scoped source labels", () => {
    expect(
      findingAskSourcesHonestyLabel({
        referencedFindings: undefined,
        referencedDecisions: undefined,
        referencedArtifacts: undefined,
      }),
    ).toBe("Sources were not stored on this answer.");

    expect(
      findingAskSourcesHonestyLabel({
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      }),
    ).toBe(FINDING_ASK_SOURCES_STORED_EMPTY_LABEL);
  });

  it("exports canonical answer omission copy", () => {
    expect(ASK_ANSWER_NOT_STORED_LABEL).toBe("Answer was not stored.");
    expect(ASK_ANSWER_STORED_EMPTY_LABEL).toBe("Answer was stored empty.");
  });

  it("labels per-list citation lists when one list is omitted and another has ids", () => {
    expect(
      reviewAskPerListSourceHonestyLabels({
        referencedFindings: null,
        referencedDecisions: ["decision-1"],
        referencedArtifacts: [],
      }),
    ).toEqual([
      REVIEW_ASK_FINDING_CITATIONS_NOT_STORED_LABEL,
      REVIEW_ASK_ARTIFACT_CITATIONS_STORED_EMPTY_LABEL,
    ]);
  });

  it("treats whitespace-only citation ids as stored empty", () => {
    const whitespaceOnly = {
      referencedFindings: ["   "],
      referencedDecisions: [],
      referencedArtifacts: [],
    };

    expect(askWireCitationRefsStoredEmpty(whitespaceOnly)).toBe(true);
    expect(askWireCitationRefsPresentInWire(whitespaceOnly)).toBe(false);
  });
});
