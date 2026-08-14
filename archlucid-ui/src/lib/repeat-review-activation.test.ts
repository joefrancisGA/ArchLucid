import { describe, expect, it } from "vitest";

import { resolveRepeatReviewActivation } from "@/lib/repeat-review-activation";

describe("repeat-review-activation", () => {
  it("returns null before the first committed review", () => {
    expect(
      resolveRepeatReviewActivation({
        committedReviewCount: 0,
        latestRunId: null,
        firstCommittedRunId: null,
        secondCommittedRunId: null,
      }),
    ).toBeNull();
  });

  it("guides operators toward a second review after the first commit", () => {
    const prompt = resolveRepeatReviewActivation({
      committedReviewCount: 1,
      latestRunId: "run-latest",
      firstCommittedRunId: "run-first",
      secondCommittedRunId: null,
    });

    expect(prompt).not.toBeNull();
    expect(prompt!.headline).toContain("second");
    expect(prompt!.primaryHref).toBe("/architecture/reviews/new");
    expect(prompt!.summary.toLowerCase()).not.toContain("stickiness");
    expect(prompt!.actions.some((action) => action.href.includes("run-first"))).toBe(true);
    expect(prompt!.actions.some((action) => action.label === "Your repeat architecture review")).toBe(true);
  });

  it("surfaces compare replay and value-report prompts after two commits", () => {
    const prompt = resolveRepeatReviewActivation({
      committedReviewCount: 2,
      latestRunId: "run-latest",
      firstCommittedRunId: "run-first",
      secondCommittedRunId: "run-second",
    });

    expect(prompt).not.toBeNull();
    expect(prompt!.summary.toLowerCase()).not.toContain("prior run");
    expect(prompt!.summary.toLowerCase()).not.toContain("stickiness");
    expect(prompt!.primaryHref).toContain("/insights/compare-two-reviews");
    expect(prompt!.actions.some((action) => action.href.includes("/internal/validate-route"))).toBe(true);
    expect(prompt!.actions.some((action) => action.href === "/insights/sponsor-report")).toBe(true);
  });
});
