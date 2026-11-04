import { describe, expect, it } from "vitest";

import { formatFindingHumanReviewStatusLabel } from "./finding-human-review-display";

describe("formatFindingHumanReviewStatusLabel", () => {
  it("distinguishes missing, stored-empty, and unrecognized statuses", () => {
    expect(formatFindingHumanReviewStatusLabel(null)).toBe("Human review status was not stored");
    expect(formatFindingHumanReviewStatusLabel("")).toBe("Human review status was stored empty");
    expect(formatFindingHumanReviewStatusLabel("99")).toBe(
      "Human review status 99 has no reviewer label.",
    );
  });
});
