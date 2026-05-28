import { describe, expect, it } from "vitest";

import { resolveFirstPilotCommandCenterPhase } from "@/lib/first-pilot-command-center-phase";
import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";

function signals(overrides: Partial<FirstPilotOperatingRailSignals> = {}): FirstPilotOperatingRailSignals {
  return {
    setupReady: true,
    setupUnhealthy: false,
    evidenceReady: true,
    hasAnyRun: false,
    readyToFinalize: false,
    hasCommittedManifest: false,
    latestRunId: null,
    firstCommittedRunId: null,
    ...overrides,
  };
}

describe("resolveFirstPilotCommandCenterPhase", () => {
  it("returns not-started when setup or evidence is incomplete", () => {
    const phase = resolveFirstPilotCommandCenterPhase({
      signals: signals({ setupReady: false, evidenceReady: false }),
      baselinesEntered: false,
      canExecute: true,
      hasBlockingRow: false,
    });

    expect(phase.phase).toBe("not-started");
    expect(phase.sponsorDisposition).toBe("readiness-only");
  });

  it("returns ready-to-create when evidence is ready but no review exists", () => {
    const phase = resolveFirstPilotCommandCenterPhase({
      signals: signals(),
      baselinesEntered: false,
      canExecute: true,
      hasBlockingRow: false,
    });

    expect(phase.phase).toBe("ready-to-create");
    expect(phase.href).toBe("/reviews/new");
  });

  it("returns ready-to-commit for in-flight reviews", () => {
    const phase = resolveFirstPilotCommandCenterPhase({
      signals: signals({ hasAnyRun: true, latestRunId: "review-1", readyToFinalize: true }),
      baselinesEntered: false,
      canExecute: true,
      hasBlockingRow: false,
    });

    expect(phase.phase).toBe("ready-to-commit");
    expect(phase.href).toBe("/reviews/review-1");
  });

  it("returns hold-before-sponsor-send when baselines are missing after commit", () => {
    const phase = resolveFirstPilotCommandCenterPhase({
      signals: signals({
        hasAnyRun: true,
        hasCommittedManifest: true,
        latestRunId: "review-1",
        firstCommittedRunId: "review-1",
      }),
      baselinesEntered: false,
      canExecute: true,
      hasBlockingRow: false,
    });

    expect(phase.phase).toBe("hold-before-sponsor-send");
    expect(phase.sponsorDisposition).toBe("hold");
    expect(phase.href).toBe("/scorecard");
  });

  it("returns ready-to-collect-proof when commit and baselines are ready", () => {
    const phase = resolveFirstPilotCommandCenterPhase({
      signals: signals({
        hasAnyRun: true,
        hasCommittedManifest: true,
        latestRunId: "review-1",
        firstCommittedRunId: "review-1",
      }),
      baselinesEntered: true,
      canExecute: true,
      hasBlockingRow: false,
    });

    expect(phase.phase).toBe("ready-to-collect-proof");
    expect(phase.sponsorDisposition).toBe("send");
  });
});
