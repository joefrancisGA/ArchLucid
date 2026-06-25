import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { resolvePilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";

const emptyCtx: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("resolvePilotNextBestAction", () => {
  it("starts a new review when the tenant has no runs", () => {
    const action = resolvePilotNextBestAction(emptyCtx, false);

    expect(action.label).toBe("Start review");
    expect(action.href).toBe("/reviews/new");
    expect(action.bridgeCopy.length).toBeGreaterThan(0);
  });

  it("continues an in-progress review when findings are not ready to finalize", () => {
    const action = resolvePilotNextBestAction(
      {
        ...emptyCtx,
        latestRunId: "run-in-progress",
        latestRunReadyToFinalize: false,
      },
      false,
    );

    expect(action.label).toBe("Continue review");
    expect(action.href).toBe("/reviews/run-in-progress");
  });

  it("finalizes when the latest run has findings but no golden manifest", () => {
    const action = resolvePilotNextBestAction(
      {
        ...emptyCtx,
        latestRunId: "run-ready",
        latestRunReadyToFinalize: true,
      },
      false,
    );

    expect(action.label).toBe("Finalize this review");
    expect(action.href).toBe("/reviews/run-ready#finalize-review");
  });

  it("opens executive summary after the tenant has a committed review", () => {
    const action = resolvePilotNextBestAction(
      {
        ...emptyCtx,
        hasCommittedManifest: true,
        committedReviewCount: 1,
        firstCommittedRunId: "run-committed",
        latestRunId: "run-committed",
      },
      true,
    );

    expect(action.label).toBe("View executive summary");
    expect(action.href).toBe("/dashboard");
  });
});
