import { describe, expect, it } from "vitest";

import { evaluateCareerArtifactHonesty } from "@/lib/career-artifact/career-artifact-honesty";
import {
  resolveCareerArtifactExportHonestyDoorFields,
  resolveSimulatorRehearsalBannerOnArtifactForExport,
} from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
import {
  EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX,
  buildEmailRunToSponsorMailtoHref,
  resolveEmailRunToSponsorRehearsalGate,
  resolveEmailRunToSponsorSendBlocked,
} from "@/lib/email-run-to-sponsor-rehearsal-gate";

describe("email-run-to-sponsor-rehearsal-gate (CG-029)", () => {
  it("requires rehearsal honesty ack for Working Rehearsal door on Simulator", () => {
    const gate = resolveEmailRunToSponsorRehearsalGate({
      workingDesk: true,
      curatedSampleRun: false,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(gate.requiresRehearsalEmailHonestyAck).toBe(true);
    expect(gate.rehearsalSubjectPrefix).toBe(EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX);
  });

  it("does not require rehearsal ack for Career door on Real mode", () => {
    const gate = resolveEmailRunToSponsorRehearsalGate({
      workingDesk: true,
      curatedSampleRun: false,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(gate.requiresRehearsalEmailHonestyAck).toBe(false);
    expect(gate.rehearsalSubjectPrefix).toBe("");
  });

  it("blocks send until rehearsal honesty is acknowledged (TB-2005)", () => {
    expect(
      resolveEmailRunToSponsorSendBlocked({
        blockSponsorPdf: false,
        requiresRehearsalEmailHonestyAck: true,
        rehearsalEmailHonestyAcknowledged: false,
      }),
    ).toBe(true);

    expect(
      resolveEmailRunToSponsorSendBlocked({
        blockSponsorPdf: false,
        requiresRehearsalEmailHonestyAck: true,
        rehearsalEmailHonestyAcknowledged: true,
      }),
    ).toBe(false);
  });

  it("allows sponsor honesty for Working Rehearsal simulator banner inputs", () => {
    const doorFields = resolveCareerArtifactExportHonestyDoorFields({
      progressSummary: {
        runId: "run-42",
        structuralExecutionMode: "Simulator",
        workingCareerRehearsalDoor: "rehearsal",
      },
      structuralExecutionMode: "Simulator",
      workingCareerRehearsalDoor: "rehearsal",
      liveDoor: "rehearsal",
    });
    const verdict = evaluateCareerArtifactHonesty({
      artifactKind: "export",
      runId: "run-42",
      progressSummary: {
        runId: "run-42",
        structuralExecutionMode: "Simulator",
        workingCareerRehearsalDoor: "rehearsal",
      },
      manifestSummary: null,
      graphSnapshot: null,
      enginesSucceeded: 41,
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      blockExternalSponsorDistribution: true,
      simulatorRehearsalBannerOnArtifact: resolveSimulatorRehearsalBannerOnArtifactForExport(doorFields),
      effectiveWorkingCareerRehearsalDoor: doorFields.effectiveWorkingCareerRehearsalDoor,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    });

    expect(verdict.blockedReasons).toEqual([]);
    expect(verdict.canRender).toBe(true);
  });

  it("forces rehearsal subject prefix and body disclaimer in mailto", () => {
    const href = buildEmailRunToSponsorMailtoHref({
      runId: "run-42",
      rehearsalSubjectPrefix: EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX,
      requiresRehearsalBodyDisclaimer: true,
    });

    expect(href).toContain("subject=");
    expect(decodeURIComponent(href)).toContain(EMAIL_RUN_TO_SPONSOR_REHEARSAL_SUBJECT_PREFIX);
    expect(decodeURIComponent(href)).toContain("rehearsal only");
    expect(decodeURIComponent(href)).toContain("rule-based analysis");
  });
});
