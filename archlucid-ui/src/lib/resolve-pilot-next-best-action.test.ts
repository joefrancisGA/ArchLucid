import { describe, expect, it } from "vitest";

import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA, PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY } from "@/lib/buyer-polish-copy";
import { resolvePilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

const emptyCtx: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("resolvePilotNextBestAction", () => {
  it("opens the completed sample when the tenant has no runs", () => {
    const action = resolvePilotNextBestAction(emptyCtx, false);

    expect(action.label).toBe(OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA);
    expect(action.href).toBe(showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId));
    expect(action.bridgeCopy).toBe(PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY);
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

  it("opens open findings after the tenant has a committed review", () => {
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

    expect(action.label).toBe("Review open findings");
    expect(action.href).toBe("/governance/findings?filter=open");
  });
});
