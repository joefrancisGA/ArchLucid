import { describe, expect, it } from "vitest";

import { reviewPresenterAssertedCaptureLine } from "@/lib/reviews/review-presenter-elicitation-copy";

describe("review-presenter-elicitation-copy", () => {
  it("labels omitted responder, key, and answer explicitly", () => {
    expect(reviewPresenterAssertedCaptureLine("", "", "")).toBe(
      "Responder was not stored. answered Question key was not stored.: Answer was not stored.",
    );
  });

  it("renders stored room answers without substitution", () => {
    expect(reviewPresenterAssertedCaptureLine("data-residency", "EU only", "Facilitator")).toBe(
      "Facilitator answered data-residency: EU only",
    );
  });
});
