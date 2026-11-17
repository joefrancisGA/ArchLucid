import { describe, expect, it } from "vitest";

import type { FirstReviewGuideStepPresentation } from "@/lib/first-review-guide-state";
import { resolveFirstReviewGuideWalkthroughNextStep } from "./first-review-guide-walkthrough-next-step";

const step = (
  partial: Partial<FirstReviewGuideStepPresentation> & Pick<FirstReviewGuideStepPresentation, "index" | "title">,
): FirstReviewGuideStepPresentation => ({
  explanation: "Explanation",
  status: "not-started",
  statusLabel: "Not started",
  actionLabel: "Go",
  actionHref: "/step",
  isNextStep: false,
  ...partial,
});

describe("resolveFirstReviewGuideWalkthroughNextStep", () => {
  it("prefers the step marked as next when it is incomplete", () => {
    const steps = [
      step({ index: 0, title: "Done step", status: "complete", isNextStep: false }),
      step({ index: 1, title: "Current step", isNextStep: true, actionHref: "/architecture/reviews/new" }),
    ];

    expect(resolveFirstReviewGuideWalkthroughNextStep(steps)?.title).toBe("Current step");
  });

  it("falls back to the first incomplete step", () => {
    const steps = [
      step({ index: 0, title: "Done step", status: "complete" }),
      step({ index: 1, title: "Later step", status: "blocked" }),
    ];

    expect(resolveFirstReviewGuideWalkthroughNextStep(steps)?.title).toBe("Later step");
  });
});
