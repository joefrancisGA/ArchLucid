import { describe, expect, it } from "vitest";

import {
  resolveSearchReviewEvidenceEmphasizedStepId,
  resolveSearchReviewEvidenceSteps,
} from "./search-review-evidence-checklist";

describe("search-review-evidence-checklist", () => {
  it("emphasizes query configuration when review is picked", () => {
    expect(
      resolveSearchReviewEvidenceEmphasizedStepId({
        reviewPicked: true,
        queryConfigured: false,
        searchComplete: false,
      }),
    ).toBe("query");
  });

  it("marks search complete when results are returned", () => {
    const steps = resolveSearchReviewEvidenceSteps({
      reviewPicked: true,
      queryConfigured: true,
      searchComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
