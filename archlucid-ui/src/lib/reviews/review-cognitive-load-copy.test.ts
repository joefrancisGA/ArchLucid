import { describe, expect, it } from "vitest";

import {
  resolveReviewCognitiveLoadEmptyLine,
  resolveReviewCognitiveLoadNextAction,
} from "@/lib/reviews/review-cognitive-load-copy";

describe("review cognitive load copy", () => {
  it("names evidence before finalize", () => {
    expect(
      resolveReviewCognitiveLoadNextAction({
        openGateReviewTab: "evidence",
        openGateLabel: "Evidence gap",
        evidenceReferenceCountNotStored: false,
      }),
    ).toBe("Finish evidence, then finalize.");
  });

  it("names the sponsor packet when the gate is clear", () => {
    expect(
      resolveReviewCognitiveLoadNextAction({
        openGateReviewTab: null,
        openGateLabel: null,
        evidenceReferenceCountNotStored: false,
      }),
    ).toContain("sponsor packet");
    expect(
      resolveReviewCognitiveLoadEmptyLine({
        openGateReviewTab: "review-package",
        evidenceReferenceCountNotStored: false,
      }),
    ).toContain("finalize");
  });
});
