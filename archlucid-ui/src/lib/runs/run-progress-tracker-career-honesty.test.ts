import { describe, expect, it } from "vitest";

import {
  resolveRunProgressTrackerCareerHonesty,
  RUN_PROGRESS_TRACKER_CAREER_BLOCKED_TERMINAL_STATUS,
  RUN_PROGRESS_TRACKER_CAREER_BLOCKED_SIGNED_RECORD_LABEL,
  RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS,
  RUN_PROGRESS_TRACKER_REHEARSAL_PRACTICE_TERMINAL_STATUS,
  RUN_PROGRESS_TRACKER_REHEARSAL_SIGNED_RECORD_LABEL,
} from "@/lib/runs/run-progress-tracker-career-honesty";

describe("run-progress-tracker-career-honesty (CG-032)", () => {
  it("Career + Real has no rehearsal overlay", () => {
    expect(
      resolveRunProgressTrackerCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator uses blocked terminal copy and step labels", () => {
    const presentation = resolveRunProgressTrackerCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.cellId).toBe("career-simulator-blocked");
    expect(presentation?.terminalLiveStatus).toBe(RUN_PROGRESS_TRACKER_CAREER_BLOCKED_TERMINAL_STATUS);
    expect(presentation?.signedRecordStepLabel).toBe(RUN_PROGRESS_TRACKER_CAREER_BLOCKED_SIGNED_RECORD_LABEL);
    expect(presentation?.signedRecordPendingLabel).toBe("Career blocked");
    expect(presentation?.completeStageStatusKind).toBe("needs-attention");
    expect(presentation?.completeStageStatusKind).not.toBe("ready");
  });

  it("Rehearsal + Simulator uses rehearsal incomplete copy", () => {
    const presentation = resolveRunProgressTrackerCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-simulator");
    expect(presentation?.terminalLiveStatus).toBe(RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS);
    expect(presentation?.signedRecordStepLabel).toBe(RUN_PROGRESS_TRACKER_REHEARSAL_SIGNED_RECORD_LABEL);
    expect(presentation?.signedRecordPendingLabel).toBe("Rehearsal incomplete");
  });

  it("Rehearsal + Real uses practice copy", () => {
    const presentation = resolveRunProgressTrackerCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-real-practice");
    expect(presentation?.terminalLiveStatus).toBe(RUN_PROGRESS_TRACKER_REHEARSAL_PRACTICE_TERMINAL_STATUS);
    expect(presentation?.signedRecordPendingLabel).toBe("Practice");
  });

  it("does not overlay on Guided desk", () => {
    expect(
      resolveRunProgressTrackerCareerHonesty({
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
