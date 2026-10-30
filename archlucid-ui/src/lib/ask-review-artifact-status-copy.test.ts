import { describe, expect, it } from "vitest";

import {
  ASK_CITATION_LISTS_NOT_STORED_MARKER,
  ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER,
  ASK_REVIEW_UNCITED_RESPONSE_MARKER,
  askReviewArtifactStatusCopy,
  messageHasUncitedAssistantOutput,
  resolveAskAssistantGroundingCitationMarker,
  resolveAskReviewArtifactStatus,
} from "./ask-review-artifact-status-copy";

describe("resolveAskAssistantGroundingCitationMarker", () => {
  it("preserves not-stored markers for omitted optional citation lists", () => {
    expect(resolveAskAssistantGroundingCitationMarker("Answer text", {}))
      .toBe(ASK_CITATION_LISTS_NOT_STORED_MARKER);
    const marker = resolveAskAssistantGroundingCitationMarker("Answer text", {
      referencedFindings: ["finding-1"],
      referencedDecisions: [],
    });
    expect(marker).toContain("Cited artifacts were not stored.");
    expect(marker).not.toContain("Cited findings were stored empty.");
  });

  it("distinguishes omitted citation refs from a stored empty list", () => {
    expect(resolveAskAssistantGroundingCitationMarker("Answer text", null)).toBe(
      ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER,
    );
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: null,
        referencedDecisions: null,
        referencedArtifacts: null,
      }),
    ).toContain("were not stored");
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: [],
        referencedDecisions: null,
        referencedArtifacts: null,
      }),
    ).toContain("Cited findings were stored empty");
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      }),
    ).toContain("stored empty");
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      }),
    ).not.toBe(ASK_REVIEW_UNCITED_RESPONSE_MARKER);
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: null,
        referencedDecisions: null,
        referencedArtifacts: null,
      }),
    ).toBe(ASK_CITATION_LISTS_NOT_STORED_MARKER);
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: ["finding-1"],
        referencedDecisions: [],
        referencedArtifacts: [],
      }),
    ).toBe("Cited decisions were stored empty. Cited artifacts were stored empty.");
    expect(
      resolveAskAssistantGroundingCitationMarker("Answer text", {
        referencedFindings: ["finding-1"],
        referencedDecisions: ["decision-1"],
        referencedArtifacts: ["artifact-1"],
      }),
    ).toBeNull();
  });
});

describe("askReviewArtifactStatusCopy", () => {
  it("describes missing review context", () => {
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: true }))).toMatch(
      /No architecture review/i,
    );
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: true }))).toMatch(/No architecture review/i);
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: false }))).toBe(
      "Finalized state was not stored.",
    );
  });

  it("describes unspecified finalized state when isFinalized is omitted", () => {
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: false }))).toBe(
      "Finalized state was not stored.",
    );
  });
});

describe("messageHasUncitedAssistantOutput", () => {
  it("flags assistant output without grounding links", () => {
    expect(messageHasUncitedAssistantOutput("Answer without links", 0)).toBe(true);
    expect(messageHasUncitedAssistantOutput("Answer with links", 2)).toBe(false);
    expect(messageHasUncitedAssistantOutput("Answer without links", null)).toBe(true);
  });
});
