import { describe, expect, it } from "vitest";

import {
  formatArchitectureReviewReadinessMessage,
} from "@/lib/architecture/architecture-review-readiness-copy";

describe("architecture-review-readiness-copy", () => {
  it("names quality attribute gaps with a numeric-target example", () => {
    expect(formatArchitectureReviewReadinessMessage(["quality-attributes"])).toMatch(
      /quality attribute/i,
    );
  });

  it("joins multiple blockers into one readiness sentence", () => {
    expect(formatArchitectureReviewReadinessMessage(["constraints", "quality-attributes"])).toMatch(
      /confirmed constraint.*quality attribute/i,
    );
  });
});
