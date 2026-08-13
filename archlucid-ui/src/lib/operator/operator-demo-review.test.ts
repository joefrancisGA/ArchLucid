import { describe, expect, it } from "vitest";

import {
  isOperatorDemoReviewRun,
  OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX,
  OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER,
  OPERATOR_DEMO_REVIEW_SYSTEM_DISPLAY_NAME,
} from "@/lib/operator/operator-demo-review";

describe("isOperatorDemoReviewRun", () => {
  it("matches the preset system display name on headline", () => {
    expect(
      isOperatorDemoReviewRun({
        headline: OPERATOR_DEMO_REVIEW_SYSTEM_DISPLAY_NAME,
      }),
    ).toBe(true);
  });

  it("matches the preset architecture description prefix", () => {
    expect(
      isOperatorDemoReviewRun({
        description: `${OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX} Extra copy.`,
      }),
    ).toBe(true);
  });

  it("matches the one-click constraint marker", () => {
    expect(
      isOperatorDemoReviewRun({
        description: `Some intake brief. ${OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER}`,
      }),
    ).toBe(true);
  });

  it("returns false for unrelated reviews", () => {
    expect(
      isOperatorDemoReviewRun({
        description: "Claims Intake Modernization — integration boundaries.",
        headline: "Claims Intake Modernization",
      }),
    ).toBe(false);
  });
});
