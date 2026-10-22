import { describe, expect, it } from "vitest";

import { whyDisabledReviewHeaderActions } from "@/lib/why-disabled-cta";

describe("whyDisabledReviewHeaderActions", () => {
  it("returns execution-failure lifecycle copy for failed reviews", () => {
    expect(
      whyDisabledReviewHeaderActions({
        label: "Execution failed",
        kind: "execution-failed",
        statusTagKind: "needs-attention",
      }),
    ).toEqual({
      kind: "lifecycle",
      message: "Unavailable until the review completes. Resolve the execution failure and re-run the review.",
    });
  });

  it("returns null when the review pipeline is complete", () => {
    expect(
      whyDisabledReviewHeaderActions({
        label: "Review complete",
        kind: "review-complete",
        statusTagKind: "ready",
      }),
    ).toBeNull();
  });
});
