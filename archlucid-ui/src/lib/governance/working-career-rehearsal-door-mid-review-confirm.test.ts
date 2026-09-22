import { describe, expect, it } from "vitest";

import {
  hasInFlightReviewPipeline,
  resolveWorkingCareerRehearsalDoorChangeConfirmCopy,
  shouldConfirmWorkingCareerRehearsalDoorChange,
} from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TITLE,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

describe("working-career-rehearsal-door-mid-review-confirm (CG-018)", () => {
  it("detects non-terminal review pipelines and ignores drafts and finished rows", () => {
    expect(
      hasInFlightReviewPipeline([
        { runId: "run-1", state: "Running" },
      ]),
    ).toBe(true);

    expect(
      hasInFlightReviewPipeline([
        { runId: "run-1", state: "Pending" },
      ]),
    ).toBe(true);

    expect(
      hasInFlightReviewPipeline([
        { runId: "run-1", state: "CancelRequested" },
      ]),
    ).toBe(true);

    expect(
      hasInFlightReviewPipeline([
        { runId: null, state: "Running" },
      ]),
    ).toBe(false);

    expect(
      hasInFlightReviewPipeline([
        { runId: "run-1", state: "Succeeded" },
      ]),
    ).toBe(false);
  });

  it("requires confirm only when the door would change during in-flight analysis", () => {
    expect(
      shouldConfirmWorkingCareerRehearsalDoorChange({
        currentDoor: "rehearsal",
        nextDoor: "career",
        hasInFlightReviewPipeline: true,
      }),
    ).toBe(true);

    expect(
      shouldConfirmWorkingCareerRehearsalDoorChange({
        currentDoor: "rehearsal",
        nextDoor: "career",
        hasInFlightReviewPipeline: false,
      }),
    ).toBe(false);

    expect(
      shouldConfirmWorkingCareerRehearsalDoorChange({
        currentDoor: "career",
        nextDoor: "career",
        hasInFlightReviewPipeline: true,
      }),
    ).toBe(false);
  });

  it("names artifact impact and does not stop the in-flight operation", () => {
    const careerToRehearsal = resolveWorkingCareerRehearsalDoorChangeConfirmCopy({
      currentDoor: "career",
      nextDoor: "rehearsal",
    });

    expect(careerToRehearsal.title).toBe(WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TITLE);
    expect(careerToRehearsal.description).toContain(WORKING_CAREER_DOOR_LABEL);
    expect(careerToRehearsal.description).toContain(WORKING_REHEARSAL_DOOR_LABEL);
    expect(careerToRehearsal.description.toLowerCase()).toContain("artifacts");
    expect(careerToRehearsal.description.toLowerCase()).toContain("does not stop");
    expect(careerToRehearsal.description.toLowerCase()).not.toContain("cancel");
  });
});
