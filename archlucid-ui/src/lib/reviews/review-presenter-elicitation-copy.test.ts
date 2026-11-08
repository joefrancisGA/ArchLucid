import { describe, expect, it } from "vitest";

import { reviewPresenterAssertedCaptureLine } from "@/lib/reviews/review-presenter-elicitation-copy";

describe("review-presenter-elicitation-copy", () => {
  it("labels omitted responder, key, and answer explicitly", () => {
    expect(reviewPresenterAssertedCaptureLine("", "", "")).toBe(
      "Responder was stored empty. answered Question key was stored empty.: Answer was stored empty.",
    );
    expect(reviewPresenterAssertedCaptureLine(null, null, null)).toBe(
      "Responder was not stored. answered Question key was not stored.: Answer was not stored.",
    );
  });

  it("renders stored room answers without substitution", () => {
    expect(reviewPresenterAssertedCaptureLine("data-residency", "EU only", "Facilitator")).toBe(
      "Facilitator answered data-residency: EU only",
    );
    expect(reviewPresenterAssertedCaptureLine("data-residency", "", "Facilitator")).toBe(
      "Facilitator answered data-residency: Answer was stored empty.",
    );
  });
});
