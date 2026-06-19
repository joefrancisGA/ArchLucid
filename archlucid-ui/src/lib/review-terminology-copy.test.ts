import { describe, expect, it } from "vitest";

import { buyerFacingReviewTerminology } from "./review-terminology-copy";

describe("buyerFacingReviewTerminology", () => {
  it("maps create-runs API detail to review vocabulary", () => {
    expect(buyerFacingReviewTerminology("Role cannot create runs")).toBe("Role cannot create reviews");
  });

  it("maps first-hour lane and sponsor copy fragments", () => {
    expect(buyerFacingReviewTerminology("Run the assessment and track progress.")).toBe(
      "execute the review and track progress.",
    );
    expect(
      buyerFacingReviewTerminology("re-run on Real mode or label exports explicitly"),
    ).toBe("re-execute in Real mode or label exports explicitly");
  });

  it("preserves runId technical disclosures", () => {
    expect(buyerFacingReviewTerminology("Review ID (API field: runId)")).toBe("Review ID (API field: runId)");
  });
});
