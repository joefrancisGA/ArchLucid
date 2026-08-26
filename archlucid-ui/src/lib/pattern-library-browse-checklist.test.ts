import { describe, expect, it } from "vitest";

import {
  resolvePatternLibraryBrowseEmphasizedStepId,
  resolvePatternLibraryBrowseSteps,
} from "./pattern-library-browse-checklist";

describe("pattern-library-browse-checklist", () => {
  it("emphasizes catalog review after a review is picked", () => {
    expect(
      resolvePatternLibraryBrowseEmphasizedStepId({
        reviewPicked: true,
        catalogReviewed: false,
        browseComplete: false,
      }),
    ).toBe("catalog");
  });

  it("marks all steps complete when browsing is complete", () => {
    const steps = resolvePatternLibraryBrowseSteps({
      reviewPicked: true,
      catalogReviewed: true,
      browseComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolvePatternLibraryBrowseEmphasizedStepId({
        reviewPicked: true,
        catalogReviewed: true,
        browseComplete: true,
      }),
    ).toBe("browse");
  });
});
