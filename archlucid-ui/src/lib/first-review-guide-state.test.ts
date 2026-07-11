import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideProgress,
  resolveFirstReviewGuideReadiness,
  resolveFirstReviewGuideSteps,
} from "@/lib/first-review-guide-state";

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
    expect(readiness.detail).toContain("optional workspace setup");
  });

  it("shows onboarding progress before any review exists", () => {
    const progress = resolveFirstReviewGuideProgress(emptyContext);

    expect(progress.summaryLabel).toBe("0 of 7 steps complete");
    expect(progress.completedCount).toBe(0);
  });

  it("marks the run step current while a review is executing", () => {
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
    expect(actions.primaryHref).toBe("/reviews/run-123");
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
});
