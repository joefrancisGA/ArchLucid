import { describe, expect, it } from "vitest";



import { resolveFirstPilotCommandCenterPhase, FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE } from "@/lib/first-pilot-command-center-phase";

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

  it("returns platform-ready when setup is unhealthy", () => {

    const phase = resolveFirstPilotCommandCenterPhase({

      signals: signals({ setupReady: false, setupUnhealthy: true, evidenceReady: false }),

      baselinesEntered: false,

      canExecute: true,

      hasBlockingRow: false,

    });



    expect(phase.phase).toBe("platform-ready");

    expect(phase.sponsorDisposition).toBe("readiness-only");

    expect(phase.href).toBe("/health");

  });



  it("returns evidence-needed when setup is ready but evidence is missing", () => {

    const phase = resolveFirstPilotCommandCenterPhase({

      signals: signals({ evidenceReady: false }),

      baselinesEntered: false,

      canExecute: true,

      hasBlockingRow: false,

    });



    expect(phase.phase).toBe("evidence-needed");

    expect(phase.href).toBe("/settings/extract-upload");

  });



  it("returns platform-ready when evidence is ready but no review exists", () => {

    const phase = resolveFirstPilotCommandCenterPhase({

      signals: signals(),

      baselinesEntered: false,

      canExecute: true,

      hasBlockingRow: false,

    });



    expect(phase.phase).toBe("platform-ready");

    expect(phase.headline).toBe("Platform ready");

    expect(phase.href).toBe("/reviews/new");

  });



  it("returns review-in-progress for in-flight reviews that are not ready to finalize", () => {

    const phase = resolveFirstPilotCommandCenterPhase({

      signals: signals({ hasAnyRun: true, latestRunId: "review-1", readyToFinalize: false }),

      baselinesEntered: false,

      canExecute: true,

      hasBlockingRow: false,

    });



    expect(phase.phase).toBe("review-in-progress");

    expect(phase.href).toBe("/reviews/review-1");

  });



  it("returns ready-to-commit when the pipeline is ready to finalize", () => {

    const phase = resolveFirstPilotCommandCenterPhase({

      signals: signals({ hasAnyRun: true, latestRunId: "review-1", readyToFinalize: true }),

      baselinesEntered: false,

      canExecute: true,

      hasBlockingRow: false,

    });



    expect(phase.phase).toBe("ready-to-commit");

    expect(phase.href).toBe("/reviews/review-1");

  });



  it("returns sponsor-packet-hold when baselines are missing after commit", () => {

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



    expect(phase.phase).toBe("sponsor-packet-hold");

    expect(phase.sponsorDisposition).toBe("hold");

    expect(phase.href).toBe("/scorecard");

  });



  it("returns deferred-buyer-requirement when deferred scope is recorded", () => {

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

      deferredBuyerRequirements: ["SOC 2 CPA"],

    });



    expect(phase.phase).toBe("deferred-buyer-requirement");

    expect(phase.sponsorDisposition).toBe("deferred");

  });



    it("returns sponsor-packet-send when commit and baselines are ready", () => {

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



    expect(phase.phase).toBe("sponsor-packet-send");

    expect(phase.sponsorDisposition).toBe("send");

  });

  it("maps phases to FIRST_PILOT_OPERATOR_PATH doc sections", () => {
    expect(FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE["platform-ready"]).toContain("Phase A");
    expect(FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE["evidence-needed"]).toContain("Phase B");
    expect(FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE["sponsor-packet-send"]).toContain("Phase D");
  });

});

