import { afterEach, describe, expect, it } from "vitest";

import {
  buildCorePilotCommitContextFromRunItems,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_REVIEW_GUIDE_STEPS } from "@/lib/first-review-guide-steps";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideProgress,
  resolveFirstReviewGuideReadiness,
  resolveFirstReviewGuideSteps,
} from "@/lib/first-review-guide-state";
import { SHOWCASE_CREATED_STATIC_DEMO_RUN_ID } from "@/lib/showcase-created-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const emptyContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
  sealedReviewRecord: null,
};

describe("first-review-guide-state", () => {
  const originalSelfHosted = process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

  afterEach(() => {
    if (originalSelfHosted === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = originalSelfHosted;
    }
  });

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
    expect(steps[2]?.title).toBe("Evaluate the architecture");
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

    expect(actions.primaryLabel).toBe("Seal review");
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

  it("strips mutating step actions after the review record is sealed", () => {
    const steps = resolveFirstReviewGuideSteps({
      commitContext: {
        ...emptyContext,
        hasCommittedManifest: true,
        firstCommittedRunId: "run-sealed",
        latestRunId: "run-sealed",
        sealedReviewRecord: {
          runId: "run-sealed",
          displayName: "Payments platform",
          finalizedOnUtc: "2026-04-15T12:00:00.000Z",
          finalizedByUserId: "user-1",
        },
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(steps.every((step) => step.actionLabel === null && step.actionHref === null)).toBe(true);
  });

  it("does not treat a trial-anchored commit without a sealed run as complete", () => {
    const input = {
      commitContext: {
        ...emptyContext,
        hasCommittedManifest: true,
        firstCommittedRunId: null,
        sealedReviewRecord: null,
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    };
    const readiness = resolveFirstReviewGuideReadiness(input);
    const progress = resolveFirstReviewGuideProgress(input.commitContext);
    const actions = resolveFirstReviewGuideHeaderActions(input);

    expect(readiness.kind).toBe("ready-to-start");
    expect(progress.phase).toBe("not-started");
    expect(actions.primaryLabel).toBe("Start first review");
  });

  it("uses sealed-record header actions when the first review is complete", () => {
    const actions = resolveFirstReviewGuideHeaderActions({
      commitContext: {
        ...emptyContext,
        hasCommittedManifest: true,
        firstCommittedRunId: "run-sealed",
        sealedReviewRecord: {
          runId: "run-sealed",
          displayName: null,
          finalizedOnUtc: null,
          finalizedByUserId: null,
        },
      },
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    });

    expect(actions.primaryLabel).toBe("Open sealed review record");
    expect(actions.primaryHref).toBe("/architecture/reviews/run-sealed");
    expect(actions.secondaryLabel).toBe("Start another review");
    expect(actions.secondaryHref).toBe("/architecture/reviews/new");
  });

  it("reports completed progress as a single finalized sentence", () => {
    const progress = resolveFirstReviewGuideProgress({
      ...emptyContext,
      hasCommittedManifest: true,
      firstCommittedRunId: "run-sealed",
      latestRunId: "run-sealed",
    });

    expect(progress.phase).toBe("complete");
    expect(progress.summaryLabel).toBe(FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE);
    expect(progress.detailLabel).toBeNull();
  });

  it("does not treat seeded sample runs as a completed first review", () => {
    const commitContext = buildCorePilotCommitContextFromRunItems(
      [
        {
          runId: SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
          projectId: "default",
          createdUtc: "2026-04-01T00:00:00.000Z",
          isSample: true,
          hasGoldenManifest: true,
          description:
            "Enterprise Copilot RAG platform — approval-ready created architecture package (synthetic guided-intake sample).",
        },
      ],
      false,
    );
    const input = {
      commitContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    };

    expect(resolveFirstReviewGuideReadiness(input).kind).toBe("ready-to-start");
    expect(resolveFirstReviewGuideProgress(commitContext).phase).toBe("not-started");
    expect(resolveFirstReviewGuideHeaderActions(input).primaryLabel).toBe("Start first review");
  });

  it("does not treat the reviewed showcase sample as a completed first review", () => {
    const commitContext = buildCorePilotCommitContextFromRunItems(
      [
        {
          runId: SHOWCASE_STATIC_DEMO_RUN_ID,
          projectId: "default",
          createdUtc: "2026-04-01T00:00:00.000Z",
          hasGoldenManifest: true,
        },
      ],
      false,
    );
    const input = {
      commitContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
    };

    expect(resolveFirstReviewGuideReadiness(input).kind).toBe("ready-to-start");
    expect(resolveFirstReviewGuideHeaderActions(input).primaryLabel).toBe("Start first review");
  });

  it("reports completed when a sealed record exists despite self-hosted setup blockers", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "true";

    const readiness = resolveFirstReviewGuideReadiness({
      commitContext: {
        ...emptyContext,
        hasCommittedManifest: true,
        firstCommittedRunId: "run-sealed",
        sealedReviewRecord: {
          runId: "run-sealed",
          displayName: null,
          finalizedOnUtc: null,
          finalizedByUserId: null,
        },
      },
      canExecute: true,
      finishSetupContext: {
        healthReady: false,
        healthLoadFailed: true,
        principalAdmin: true,
      },
      finishSetupLoaded: true,
    });

    expect(readiness.kind).toBe("completed");
    expect(readiness.headline).toBe("First review completed");
  });
});
