import { describe, expect, it } from "vitest";

import {
  compareToPriorPackageHref,
  priorPackageInheritedTitle,
  readPriorRunIdFromSearch,
  secondReviewFromPriorHref,
} from "@/lib/second-review-prior-package";

describe("second-review-prior-package", () => {
  it("opens Quick start with the prior package id, not a blank new review", () => {
    const href = secondReviewFromPriorHref("run-first");

    expect(href).toContain("/architecture/reviews/new?");
    expect(href).toContain("priorRunId=run-first");
    expect(href).toContain("path=quick-review");
    expect(href).not.toBe("/architecture/reviews/new");
  });

  it("reads priorRunId or cloneFromRunId from the query", () => {
    expect(readPriorRunIdFromSearch(new URLSearchParams("priorRunId=abc"))).toBe("abc");
    expect(readPriorRunIdFromSearch(new URLSearchParams("cloneFromRunId=def"))).toBe("def");
    expect(readPriorRunIdFromSearch(new URLSearchParams())).toBeNull();
  });

  it("builds a compare href for the known pair", () => {
    expect(compareToPriorPackageHref("prior", "later")).toContain("compare-two-reviews");
  });

  it("recovers the quoted title from a generated brief", () => {
    expect(
      priorPackageInheritedTitle({
        displayName: 'Architecture review intake for "Retail API modernization review".',
        description: null,
      }),
    ).toBe("Retail API modernization review");
  });
});
