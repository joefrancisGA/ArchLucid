import { describe, expect, it } from "vitest";

import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import {
  applyRunStatusBadgeWorkingCareerHonesty,
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
  RUN_STATUS_BADGE_WORKING_CAREER_HONESTY_CELL_IDS,
} from "@/lib/runs/run-status-badge-career-honesty";

describe("run-status-badge-career-honesty (CG-031)", () => {
  it("names all four mismatch cells", () => {
    expect(RUN_STATUS_BADGE_WORKING_CAREER_HONESTY_CELL_IDS).toEqual([
      "career-real",
      "career-simulator-blocked",
      "rehearsal-simulator",
      "rehearsal-real-practice",
    ]);
  });

  it("Career + Real keeps career-complete (no overlay on finalized)", () => {
    expect(
      resolveRunStatusBadgeWorkingCareerHonestyCell({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBe("career-real");

    expect(
      applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.finalized, {
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator is blocked — not a green Career chip", () => {
    const overlay = applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.finalized, {
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(overlay?.cellId).toBe("career-simulator-blocked");
    expect(overlay?.displayLabel).toBe(RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL);
    expect(overlay?.statusTagKind).toBe("blocked");
    expect(overlay?.statusTagKind).not.toBe("ready");
  });

  it("Rehearsal + Simulator shows rehearsal incomplete", () => {
    const overlay = applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.finalized, {
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(overlay?.cellId).toBe("rehearsal-simulator");
    expect(overlay?.displayLabel).toBe(RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL);
    expect(overlay?.statusTagKind).toBe("needs-attention");
    expect(overlay?.statusTagKind).not.toBe("ready");
  });

  it("Rehearsal + Real shows practice — not record-complete green", () => {
    const overlay = applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.finalized, {
      workingDesk: true,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(overlay?.cellId).toBe("rehearsal-real-practice");
    expect(overlay?.displayLabel).toBe(RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL);
    expect(overlay?.statusTagKind).toBe("needs-attention");
    expect(overlay?.statusTagKind).not.toBe("ready");
  });

  it("does not overlay non-finalized pipeline labels", () => {
    expect(
      applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.inPipeline, {
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("does not overlay on Guided desk", () => {
    expect(
      applyRunStatusBadgeWorkingCareerHonesty(PIPELINE_STATUS_LABELS.finalized, {
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
