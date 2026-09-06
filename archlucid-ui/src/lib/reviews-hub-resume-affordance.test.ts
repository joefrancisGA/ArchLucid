import { describe, expect, it } from "vitest";

import { resolveReviewsHubResumeAffordancePlan } from "@/lib/reviews-hub-resume-affordance";

describe("resolveReviewsHubResumeAffordancePlan", () => {
  it("hides continue-last when the hub continue strip already surfaces the same run", () => {
    const plan = resolveReviewsHubResumeAffordancePlan({
      continueStripRunId: "review-42",
      continueLastViewedRunId: "review-42",
    });

    expect(plan.showContinueLastViewed).toBe(false);
    expect(plan.continueLastViewedVariant).toBe("outline");
  });

  it("demotes continue-last to outline when the strip points at a different in-flight run", () => {
    const plan = resolveReviewsHubResumeAffordancePlan({
      continueStripRunId: "review-in-flight",
      continueLastViewedRunId: "review-last-viewed",
    });

    expect(plan.showContinueLastViewed).toBe(true);
    expect(plan.continueLastViewedVariant).toBe("outline");
  });

  it("keeps continue-last as the sole primary when no continue strip candidate exists", () => {
    const plan = resolveReviewsHubResumeAffordancePlan({
      continueStripRunId: null,
      continueLastViewedRunId: "review-42",
    });

    expect(plan.showContinueLastViewed).toBe(true);
    expect(plan.continueLastViewedVariant).toBe("primary");
  });
});
