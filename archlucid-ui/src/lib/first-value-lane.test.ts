import { describe, expect, it } from "vitest";

import {
  FIRST_VALUE_LANE_PHASES,
  isFirstValueLaneComplete,
  resolveFirstValueLanePhases,
  type FirstValueLaneSignals,
} from "./first-value-lane";

const emptyCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
};

function signals(partial: Partial<FirstValueLaneSignals>): FirstValueLaneSignals {
  return {
    hasAnyRun: false,
    hasUncommittedRun: false,
    healthBlocked: false,
    commitContext: emptyCommitContext,
    ...partial,
  };
}

describe("first-value-lane", () => {
  it("exposes four canonical phases", () => {
    expect(FIRST_VALUE_LANE_PHASES).toHaveLength(4);
  });

  it("uses create-review package heading and start-architecture-review CTA labels", () => {
    const phase = FIRST_VALUE_LANE_PHASES.find((candidate) => candidate.id === "create-review");

    expect(phase?.title).toBe("Create review package");
    expect(phase?.primaryLabel).toBe("Start architecture review");
  });

  it("marks create-review in progress for a net-new tenant", () => {
    const phases = resolveFirstValueLanePhases(signals({}));

    expect(phases[0]?.status).toBe("in_progress");
    expect(phases[1]?.status).toBe("not_started");
  });

  it("marks lane complete when sponsor artifact phase is done", () => {
    const phases = resolveFirstValueLanePhases(
      signals({
        hasAnyRun: true,
        commitContext: {
          ...emptyCommitContext,
          hasCommittedManifest: true,
          firstCommittedRunId: "run-123",
        },
      }),
    );

    expect(isFirstValueLaneComplete(phases)).toBe(true);
    expect(phases[3]?.primaryHref).toContain("run-123");
  });

  it("blocks all phases when platform health is blocked", () => {
    const phases = resolveFirstValueLanePhases(signals({ healthBlocked: true }));

    expect(phases.every((phase) => phase.status === "blocked")).toBe(true);
  });
});
