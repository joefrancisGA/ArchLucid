import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  buildFirstPilotOperatingRailSignals,
  resolveFirstPilotOperatingRailSteps,
} from "./first-pilot-operating-rail-status";
import { FIRST_PILOT_OPERATING_RAIL_STEP_COUNT } from "./first-pilot-operating-rail-steps";

function run(partial: Partial<RunSummary> & { runId: string }): RunSummary {
  return {
    runId: partial.runId,
    projectId: partial.projectId ?? "default",
    hasGoldenManifest: partial.hasGoldenManifest,
    hasContextSnapshot: partial.hasContextSnapshot,
    hasFindingsSnapshot: partial.hasFindingsSnapshot,
    hasGraphSnapshot: partial.hasGraphSnapshot,
  } as RunSummary;
}

describe("resolveFirstPilotOperatingRailSteps", () => {
  it("marks the first incomplete step as current and earlier steps complete", () => {
    const signals = buildFirstPilotOperatingRailSignals({
      healthStatus: "Healthy",
      runs: [run({ runId: "r1", hasContextSnapshot: true })],
      evidenceAcknowledged: false,
      hasCommittedManifest: false,
      latestRunId: "r1",
      firstCommittedRunId: null,
    });

    const resolved = resolveFirstPilotOperatingRailSteps(signals);

    expect(resolved).toHaveLength(FIRST_PILOT_OPERATING_RAIL_STEP_COUNT);
    expect(resolved[0]?.status).toBe("complete");
    expect(resolved[1]?.status).toBe("complete");
    expect(resolved[2]?.status).toBe("complete");
    expect(resolved[3]?.status).toBe("current");
  });

  it("surfaces setup attention when readiness is unhealthy", () => {
    const signals = buildFirstPilotOperatingRailSignals({
      healthStatus: "Unhealthy",
      runs: [],
      evidenceAcknowledged: false,
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    });

    const resolved = resolveFirstPilotOperatingRailSteps(signals);

    expect(resolved[0]?.status).toBe("attention");
    expect(resolved[0]?.primaryHref).toBe("/health");
  });

  it("deep-links execute and sponsor steps to the latest run when available", () => {
    const signals = buildFirstPilotOperatingRailSignals({
      healthStatus: "Healthy",
      runs: [
        run({
          runId: "run-abc",
          hasContextSnapshot: true,
          hasFindingsSnapshot: true,
          hasGoldenManifest: true,
        }),
      ],
      evidenceAcknowledged: false,
      hasCommittedManifest: true,
      latestRunId: "run-abc",
      firstCommittedRunId: "run-abc",
    });

    const resolved = resolveFirstPilotOperatingRailSteps(signals);

    expect(resolved.every((r) => r.status === "complete")).toBe(true);
    expect(resolved[5]?.primaryHref).toBe("/reviews/run-abc");
  });
});
