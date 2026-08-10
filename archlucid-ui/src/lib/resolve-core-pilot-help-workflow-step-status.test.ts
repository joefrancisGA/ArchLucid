import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { CORE_PILOT_HELP_WORKFLOW_STEPS } from "@/lib/core-pilot-help-guide-content";
import { resolveCorePilotHelpWorkflowStepStatus } from "@/lib/resolve-core-pilot-help-workflow-step-status";

const emptyCtx: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

const inProgressRun: CorePilotCommitContext = {
  ...emptyCtx,
  latestRunId: "run-1",
};

const readyToFinalize: CorePilotCommitContext = {
  ...inProgressRun,
  latestRunReadyToFinalize: true,
};

const committedTenant: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 1,
  latestRunId: "run-done",
  firstCommittedRunId: "run-done",
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("resolveCorePilotHelpWorkflowStepStatus", () => {
  it("marks every step Not started on an empty workspace", () => {
    for (const step of CORE_PILOT_HELP_WORKFLOW_STEPS) {
      expect(resolveCorePilotHelpWorkflowStepStatus(step, emptyCtx)).toMatchObject({
        label: "Not started",
      });
    }
  });

  it("marks finalize Ready to finalize when findings are ready", () => {
    const step4 = CORE_PILOT_HELP_WORKFLOW_STEPS[3]!;

    expect(resolveCorePilotHelpWorkflowStepStatus(step4, readyToFinalize)).toMatchObject({
      kind: "needs-attention",
      label: "Ready to finalize",
    });
  });

  it("marks steps 1–4 Complete and step 5 actionable after finalize", () => {
    const labels = CORE_PILOT_HELP_WORKFLOW_STEPS.map((step) =>
      resolveCorePilotHelpWorkflowStepStatus(step, committedTenant).label,
    );

    expect(labels).toEqual(["Complete", "Complete", "Complete", "Complete", "In progress"]);
  });

  it("does not mark steps 2–4 Complete when a newer in-progress review exists", () => {
    const committedPlusNewerRun: CorePilotCommitContext = {
      hasCommittedManifest: true,
      committedReviewCount: 1,
      latestRunId: "run-newer",
      firstCommittedRunId: "run-done",
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    };

    const labels = CORE_PILOT_HELP_WORKFLOW_STEPS.map((step) =>
      resolveCorePilotHelpWorkflowStepStatus(step, committedPlusNewerRun).label,
    );

    expect(labels).toEqual(["Complete", "In progress", "In progress", "In progress", "In progress"]);
  });
});
