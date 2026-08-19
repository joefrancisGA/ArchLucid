import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { CORE_PILOT_HELP_WORKFLOW_STEPS } from "@/lib/core-pilot-help-guide-content";
import { CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS } from "@/lib/core-pilot-help-guide-content";
import { BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR } from "@/lib/first-week-route-guidance";
import {
  isCorePilotHelpWorkflowContextPendingCta,
  resolveCorePilotHelpWorkflowStepCta,
} from "@/lib/resolve-core-pilot-help-workflow-step-cta";

const emptyCtx: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

const step3 = CORE_PILOT_HELP_WORKFLOW_STEPS[2]!;
const step4 = CORE_PILOT_HELP_WORKFLOW_STEPS[3]!;
const step5 = CORE_PILOT_HELP_WORKFLOW_STEPS[4]!;

describe("resolveCorePilotHelpWorkflowStepCta (TB-1042)", () => {
  it("TB-1381: surfaces a step-1 start CTA on the stepper", () => {
    const step1 = resolveCorePilotHelpWorkflowStepCta(CORE_PILOT_HELP_WORKFLOW_STEPS[0]!, emptyCtx);

    expect(step1.enabled).toBe(true);
    expect(step1.href).toBe("/architecture/reviews/new");
    expect(step1.label).toBe(CORE_PILOT_HELP_WORKFLOW_STEPS[0]!.ctaLabel);
  });

  it("TB-1331: routes step 2 to honest Start-first CTA or review-detail evidence tab", () => {
    const step2 = CORE_PILOT_HELP_WORKFLOW_STEPS[1]!;

    const step2Empty = resolveCorePilotHelpWorkflowStepCta(step2, emptyCtx);

    expect(step2Empty.href).toBe("/architecture/reviews/new");
    expect(step2Empty.label).toBe("Start a review to add evidence");
    expect(step2.ctaLabel).toBe("Start a review to add evidence");
    expect(step2.href).toBe("/architecture/reviews/new");
    expect(step2Empty.helperText).toContain("review detail");

    const step2WithRun = resolveCorePilotHelpWorkflowStepCta(step2, {
      ...emptyCtx,
      latestRunId: "run-abc",
    });

    expect(step2WithRun.href).toBe("/architecture/reviews/run-abc?reviewTab=evidence");
    expect(step2WithRun.label).toBe("Add evidence on review detail");
    expect(step2WithRun.href).not.toContain("/architecture/reviews/new");
  });

  it("gates steps 3–5 to Start a review first when no active run", () => {
    for (const step of [step3, step4, step5]) {
      const cta = resolveCorePilotHelpWorkflowStepCta(step, emptyCtx);

      expect(cta.label).toBe("Start a review first");
      expect(cta.href).toBe("/architecture/reviews/new");
      expect(cta.href).not.toContain("projectId=default");
    }
  });

  it("disables steps 3–5 while commit context is loading", () => {
    const cta = resolveCorePilotHelpWorkflowStepCta(step3, null);

    expect(cta.enabled).toBe(false);
    expect(cta.href).toBeNull();
    expect(isCorePilotHelpWorkflowContextPendingCta(cta)).toBe(true);
  });

  it("TB-1333: never returns finalize/export labels while context is loading", () => {
    for (const step of [CORE_PILOT_HELP_WORKFLOW_STEPS[1]!, step3, step4, step5]) {
      const cta = resolveCorePilotHelpWorkflowStepCta(step, null);

      expect(cta.label).toBe(CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS);
      expect(cta.label).not.toBe("Finalize on review detail");
      expect(cta.label).not.toBe("Open exports");
      expect(cta.label).not.toBe("Open review detail");
    }
  });

  it("deep-links monitor/finalize/exports when a run exists", () => {
    const inProgress: CorePilotCommitContext = {
      ...emptyCtx,
      latestRunId: "run-abc",
      latestRunReadyToFinalize: true,
    };

    expect(resolveCorePilotHelpWorkflowStepCta(step3, inProgress)).toMatchObject({
      href: "/architecture/reviews/run-abc",
      label: "Open review detail",
    });
    expect(resolveCorePilotHelpWorkflowStepCta(step4, inProgress)).toMatchObject({
      href: `/architecture/reviews/run-abc${BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR}`,
      label: "Finalize on review detail",
    });

    const committed: CorePilotCommitContext = {
      ...emptyCtx,
      hasCommittedManifest: true,
      committedReviewCount: 1,
      firstCommittedRunId: "run-done",
      latestRunId: "run-done",
    };

    expect(resolveCorePilotHelpWorkflowStepCta(step5, committed)).toMatchObject({
      href: "/architecture/reviews/run-done#artifacts-exports",
      label: "Open exports",
    });
  });

  it("prefers a newer in-progress run over an older committed package for finalize", () => {
    const mixed: CorePilotCommitContext = {
      ...emptyCtx,
      hasCommittedManifest: true,
      committedReviewCount: 1,
      firstCommittedRunId: "run-old",
      latestRunId: "run-new",
      latestRunReadyToFinalize: false,
    };

    expect(resolveCorePilotHelpWorkflowStepCta(step4, mixed)).toMatchObject({
      href: "/architecture/reviews/run-new",
      label: "Open review detail",
    });
  });
});
