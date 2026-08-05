import { describe, expect, it } from "vitest";

import {
  askReviewArtifactStatusCopy,
  messageHasUncitedAssistantOutput,
  resolveAskReviewArtifactStatus,
} from "@/lib/ask-review-artifact-status-copy";

describe("ask-review-artifact-status-copy", () => {
  it("maps finalized, draft, and missing review contexts", () => {
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: false, isFinalized: true }))).toMatch(
      /finalized architecture review/i,
    );
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: false, isFinalized: false }))).toMatch(
      /Draft review context/i,
    );
    expect(askReviewArtifactStatusCopy(resolveAskReviewArtifactStatus({ runMissing: true }))).toMatch(/No architecture review/i);
  });

  it("flags assistant output without grounding links", () => {
    expect(messageHasUncitedAssistantOutput("Answer without links", 0)).toBe(true);
    expect(messageHasUncitedAssistantOutput("Answer with links", 2)).toBe(false);
  });
});
