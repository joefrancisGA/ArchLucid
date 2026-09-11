import { describe, expect, it } from "vitest";

import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { PIPELINE_STATUS_TOOLTIPS } from "@/lib/i18n";
import {
  resolvePipelineStatusTooltip,
  resolveWorkingPipelineCompleteReviewLabel,
  resolveWorkingPipelineEngineeringCompleteStatus,
  WORKING_PIPELINE_CAREER_BLOCKED_COMPLETE_LABEL,
  WORKING_PIPELINE_REHEARSAL_COMPLETE_LABEL,
  WORKING_PIPELINE_REHEARSAL_PRACTICE_COMPLETE_LABEL,
  WORKING_PIPELINE_READY_TO_FINALIZE_TOOLTIP,
} from "@/lib/runs/pipeline-complete-career-honesty-copy";

describe("pipeline-complete-career-honesty-copy (CG-033)", () => {
  it("keeps canonical tooltips on Guided desk", () => {
    expect(
      resolvePipelineStatusTooltip(PIPELINE_STATUS_LABELS.readyToFinalize, {
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBe(PIPELINE_STATUS_TOOLTIPS.readyToFinalize);
  });

  it("maps Career + Simulator review-complete label to Career blocked", () => {
    expect(
      resolveWorkingPipelineCompleteReviewLabel({
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBe(WORKING_PIPELINE_CAREER_BLOCKED_COMPLETE_LABEL);
  });

  it("maps Rehearsal + Simulator to rehearsal complete — not career-complete", () => {
    expect(
      resolveWorkingPipelineCompleteReviewLabel({
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(WORKING_PIPELINE_REHEARSAL_COMPLETE_LABEL);
  });

  it("maps Rehearsal + Real to practice complete copy", () => {
    expect(
      resolveWorkingPipelineCompleteReviewLabel({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(WORKING_PIPELINE_REHEARSAL_PRACTICE_COMPLETE_LABEL);
  });

  it("swaps ready-to-finalize tooltip on Working rehearsal paths", () => {
    expect(
      resolvePipelineStatusTooltip(PIPELINE_STATUS_LABELS.readyToFinalize, {
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(WORKING_PIPELINE_READY_TO_FINALIZE_TOOLTIP);
  });

  it("swaps engineering pipeline-complete status on Working Career + Simulator", () => {
    const status = resolveWorkingPipelineEngineeringCompleteStatus({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(status).toMatch(/Career blocked on Simulator/i);
    expect(status).not.toBe("Pipeline complete — refresh for full detail.");
  });
});
