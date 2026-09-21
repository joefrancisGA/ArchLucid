import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH,
  OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH,
  OPERATOR_HOME_RETURNING_ORIENTATION_PARAGRAPH,
  operatorHomeOrientationParagraph,
} from "./operator-home-page-surface-copy";

describe("operatorHomeOrientationParagraph", () => {
  it("uses start language when the workspace has nothing to resume", () => {
    expect(operatorHomeOrientationParagraph()).toBe(OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH);
    expect(operatorHomeOrientationParagraph({ hasReviews: false, reviewPackagesActive: 0 })).toBe(
      OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH,
    );
    expect(OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH.toLowerCase()).not.toContain("resume");
    expect(OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH.toLowerCase()).not.toContain("continue");
  });

  it("uses resume language only when reviews are already in progress", () => {
    expect(
      operatorHomeOrientationParagraph({ hasReviews: true, reviewPackagesActive: 1 }),
    ).toBe(OPERATOR_HOME_RETURNING_ORIENTATION_PARAGRAPH);
    expect(OPERATOR_HOME_RETURNING_ORIENTATION_PARAGRAPH.toLowerCase()).toContain("resume");
  });

  it("uses open-completed language when reviews exist but none are in progress", () => {
    expect(
      operatorHomeOrientationParagraph({ hasReviews: true, reviewPackagesActive: 0 }),
    ).toBe(OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH);
    expect(OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH.toLowerCase()).not.toContain("resume");
    expect(OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH.toLowerCase()).not.toContain("in-progress");
  });
});
