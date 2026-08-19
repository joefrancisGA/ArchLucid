import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_STEPS } from "@/lib/first-review-guide-steps";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideProgress,
  resolveFirstReviewGuideReadiness,
  resolveFirstReviewGuideSteps,
} from "@/lib/first-review-guide-state";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const emptyContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("first-review-guide-state", () => {
  it("reports ready to start for an empty workspace with execute permission", () => {
    const readiness = resolveFirstReviewGuideReadiness({
      commitContext: emptyContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(readiness.headline).toBe("Ready to start");
    expect(readiness.detail).toBe("Optional workspace setup can be completed later.");
  });

  it("shows zero progress before any review exists", () => {
    const progress = resolveFirstReviewGuideProgress(emptyContext);

    expect(progress.phase).toBe("not-started");
    expect(progress.summaryLabel).toBe("Not started");
    expect(progress.detailLabel).toContain("step 1");
    expect(progress.progressFraction).toBe(0);
    expect(progress.completedStepCount).toBe(0);
    expect(progress.totalStepCount).toBe(7);
    expect(Math.round(progress.progressFraction * 100)).toBe(0);
  });

  it("computes progress from completed steps instead of a fixed midpoint", () => {
    const progress = resolveFirstReviewGuideProgress({
      ...emptyContext,
      latestRunId: "run-123",
    });

    expect(progress.phase).toBe("in-progress");
    expect(progress.summaryLabel).toBe("In progress");
    expect(progress.completedStepCount).toBe(2);
    expect(progress.progressFraction).toBeCloseTo(2 / 7);
    expect(Math.round(progress.progressFraction * 100)).not.toBe(50);
  });

  it("marks the evaluation step current while a review is executing", () => {
    const steps = resolveFirstReviewGuideSteps({
      commitContext: {
        ...emptyContext,
        latestRunId: "run-123",
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(steps[2]?.status).toBe("current");
    expect(steps[0]?.status).toBe("complete");
    expect(steps[2]?.title).toBe("Evaluate the architecture review");
  });

  it("uses distinct walkthrough actions instead of repeating start review", () => {
    const steps = resolveFirstReviewGuideSteps({
      commitContext: emptyContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    const startReviewLinks = steps.filter((step) => step.actionLabel === "Start review");

    expect(startReviewLinks).toHaveLength(1);
    expect(startReviewLinks[0]?.actionHref).toBe(REVIEWS_NEW_PATH);
    expect(steps[1]?.actionLabel).toBe("Open evidence intake");
    expect(steps[1]?.actionHref).toBe(REVIEWS_NEW_GUIDED_INTAKE_HREF);
    expect(steps[2]?.actionLabel).toBeNull();
  });

  it("deep-links later walkthrough steps to findings, decisions, finalize, and share", () => {
    const steps = resolveFirstReviewGuideSteps({
      commitContext: {
        ...emptyContext,
        latestRunId: "run-123",
        latestRunReadyToFinalize: true,
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(steps[3]?.actionHref).toBe("/architecture/reviews/run-123?reviewTab=findings");
    expect(steps[4]?.actionHref).toBe("/architecture/reviews/run-123?reviewTab=decisions-remediation");
    expect(steps[5]?.actionHref).toBe("/architecture/reviews/run-123#finalize-review");
    expect(steps[6]?.actionHref).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?reviewTab=review-package`,
    );
  });

  it("uses continue review when a run is in progress", () => {
    const actions = resolveFirstReviewGuideHeaderActions({
      commitContext: {
        ...emptyContext,
        latestRunId: "run-123",
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(actions.primaryLabel).toBe("Continue review");
    expect(actions.primaryHref).toBe("/architecture/reviews/run-123");
  });

  it("uses finalize review when the run is ready to finalize", () => {
    const actions = resolveFirstReviewGuideHeaderActions({
      commitContext: {
        ...emptyContext,
        latestRunId: "run-123",
        latestRunReadyToFinalize: true,
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(actions.primaryLabel).toBe("Finalize review");
    expect(actions.primaryHref).toBe("/architecture/reviews/run-123");
  });

  it("disables start when the caller cannot execute", () => {
    const actions = resolveFirstReviewGuideHeaderActions({
      commitContext: emptyContext,
      canExecute: false,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(actions.primaryDisabled).toBe(true);
    expect(actions.primaryLabel).toBe("Start first review");
  });

  it("step 3 title avoids standalone Run job language (ARF P0-7)", () => {
    const title = FIRST_REVIEW_GUIDE_STEPS[2]?.title ?? "";

    expect(title.toLowerCase()).not.toMatch(/\brun\b/);
    expect(title).toMatch(/Evaluate/i);
  });
});
