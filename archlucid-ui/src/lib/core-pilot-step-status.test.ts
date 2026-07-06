import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  areCorePilotRequiredStepsComplete,
  buildCorePilotProgressFromStatuses,
  buildCorePilotStepStatusContext,
  resolveCorePilotNextStepIndex,
  resolveCorePilotStepStatus,
  resolveCorePilotStepStatuses,
} from "@/lib/core-pilot-step-status";

const emptyTenant: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

const inProgressRun: CorePilotCommitContext = {
  ...emptyTenant,
  latestRunId: "run-1",
};

const readyToFinalize: CorePilotCommitContext = {
  ...inProgressRun,
  latestRunReadyToFinalize: true,
};

const committedTenant: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 1,
  latestRunId: "run-committed",
  firstCommittedRunId: "run-committed",
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

const noSkips = Array.from({ length: 7 }, () => false);

describe("resolveCorePilotStepStatus", () => {
  it("marks required steps not started on an empty tenant", () => {
    const context = buildCorePilotStepStatusContext(emptyTenant, noSkips);

    expect(resolveCorePilotStepStatus(0, context)).toBe("not-started");
    expect(resolveCorePilotStepStatus(1, context)).toBe("not-started");
    expect(resolveCorePilotStepStatus(2, context)).toBe("not-started");
  });

  it("marks execute in progress when a run exists but is not ready to finalize", () => {
    const context = buildCorePilotStepStatusContext(inProgressRun, noSkips);

    expect(resolveCorePilotStepStatus(0, context)).toBe("done");
    expect(resolveCorePilotStepStatus(1, context)).toBe("in-progress");
    expect(resolveCorePilotStepStatus(2, context)).toBe("not-started");
  });

  it("marks finalize in progress when the run is ready to finalize", () => {
    const context = buildCorePilotStepStatusContext(readyToFinalize, noSkips);

    expect(resolveCorePilotStepStatus(1, context)).toBe("done");
    expect(resolveCorePilotStepStatus(2, context)).toBe("in-progress");
  });

  it("marks required steps done after commit", () => {
    const context = buildCorePilotStepStatusContext(committedTenant, noSkips);
    const statuses = resolveCorePilotStepStatuses(context);

    expect(statuses.slice(0, 3)).toEqual(["done", "done", "done"]);
    expect(statuses[6]).toBe("done");
    expect(areCorePilotRequiredStepsComplete(statuses)).toBe(true);
  });

  it("honors optional-step skip flags without marking required steps skipped", () => {
    const skipped = [...noSkips];
    skipped[3] = true;
    const context = buildCorePilotStepStatusContext(committedTenant, skipped);

    expect(resolveCorePilotStepStatus(3, context)).toBe("skipped");
    expect(resolveCorePilotStepStatus(0, context)).toBe("done");
  });
});

describe("buildCorePilotProgressFromStatuses", () => {
  it("surfaces the first incomplete required step as next", () => {
    const context = buildCorePilotStepStatusContext(readyToFinalize, noSkips);
    const statuses = resolveCorePilotStepStatuses(context);
    const progress = buildCorePilotProgressFromStatuses(statuses);

    expect(resolveCorePilotNextStepIndex(statuses)).toBe(2);
    expect(progress.nextStepIndex).toBe(2);
    expect(progress.allDone).toBe(false);
  });

  it("treats required completion as allDone even when optional steps remain", () => {
    const context = buildCorePilotStepStatusContext(committedTenant, noSkips);
    const statuses = resolveCorePilotStepStatuses(context);
    const progress = buildCorePilotProgressFromStatuses(statuses);

    expect(progress.allDone).toBe(true);
    expect(progress.nextStepIndex).toBe(3);
  });
});
