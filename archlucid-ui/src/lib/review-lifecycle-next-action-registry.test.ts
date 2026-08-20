import { describe, expect, it } from "vitest";

import {
  POST_COMMIT_OPTIONAL_ACTION_IDS,
  REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY,
  listReviewLifecycleNextActions,
  reviewLifecycleNextActionInstance,
} from "@/lib/review-lifecycle-next-action-registry";

describe("review-lifecycle-next-action-registry (TB-2366)", () => {
  it("lists unique action ids in the registry", () => {
    const ids = REVIEW_LIFECYCLE_NEXT_ACTION_REGISTRY.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("filters optional post-commit actions through POST_COMMIT_OPTIONAL_ACTION_IDS", () => {
    const actions = listReviewLifecycleNextActions({
      surface: "post-commit-habit-loop",
      phase: "post-finalize",
      hrefInput: {
        runId: "run-1",
        showCompareCta: true,
        hasManifest: true,
        buyerShowcaseQuickLinks: false,
      },
    });

    expect(actions.primary?.id).toBe("sponsor-packet");
    expect(actions.optional.map((action) => action.id)).toEqual(
      expect.arrayContaining(["compare", "schedule-recurrence", "evidence-chain", "value-delta", "second-review"]),
    );
    expect(actions.optional.some((action) => action.id === "governance")).toBe(false);
    expect(POST_COMMIT_OPTIONAL_ACTION_IDS).toContain("compare");
  });

  it("omits compare when compare is unavailable", () => {
    const actions = listReviewLifecycleNextActions({
      surface: "post-commit-habit-loop",
      phase: "post-finalize",
      hrefInput: {
        runId: "run-1",
        showCompareCta: false,
        hasManifest: true,
      },
    });

    expect(actions.optional.some((action) => action.id === "compare")).toBe(false);
  });

  it("lists in-review review-package actions", () => {
    const actions = listReviewLifecycleNextActions({
      surface: "review-package",
      phase: "in-review",
      hrefInput: {
        runId: "run-1",
        correctionHref: "/architecture/reviews/new?rerun=run-1",
      },
    });

    expect(actions.optional.map((action) => action.id)).toContain("second-review");
    expect(
      reviewLifecycleNextActionInstance({
        id: "triage-findings",
        hrefInput: { runId: "run-1" },
      })?.label,
    ).toBe("Review findings");
    expect(
      reviewLifecycleNextActionInstance({
        id: "add-evidence",
        hrefInput: { runId: "run-1" },
      })?.href,
    ).toContain("reviewTab=evidence");
    expect(
      reviewLifecycleNextActionInstance({
        id: "answer-clarifications",
        hrefInput: {
          runId: "run-1",
          correctionHref: "/architecture/reviews/new?rerun=run-1",
        },
      })?.href,
    ).toBe("/architecture/reviews/new?rerun=run-1");
  });
});
