import { describe, expect, it } from "vitest";

import {
  ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER,
  ASK_REVIEW_UNCITED_RESPONSE_MARKER,
  resolveAskAssistantGroundingCitationMarker,
} from "./ask-review-artifact-status-copy";

describe("resolveAskAssistantGroundingCitationMarker", () => {
  it("distinguishes omitted grounding links from a stored empty list", () => {
    expect(resolveAskAssistantGroundingCitationMarker("Answer text", null)).toBe(
      ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER,
    );
    expect(resolveAskAssistantGroundingCitationMarker("Answer text", [])).toBe(
      ASK_REVIEW_UNCITED_RESPONSE_MARKER,
    );
    expect(resolveAskAssistantGroundingCitationMarker("Answer text", [{ findingId: "f-1" }])).toBeNull();
  });
});
