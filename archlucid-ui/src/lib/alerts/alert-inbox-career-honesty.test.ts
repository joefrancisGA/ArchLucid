import { describe, expect, it } from "vitest";

import {
  alertTitleShowsRehearsalHonesty,
  ALERT_INBOX_REHEARSAL_TITLE_PREFIX,
  resolveAlertInboxCareerHonesty,
} from "@/lib/alerts/alert-inbox-career-honesty";
import {
  RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
} from "@/lib/runs/run-status-badge-career-honesty";

describe("alert-inbox-career-honesty (CG-036)", () => {
  it("Career + Real has no inbox rehearsal chip", () => {
    expect(
      resolveAlertInboxCareerHonesty({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator shows career blocked chip", () => {
    const presentation = resolveAlertInboxCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.cellId).toBe("career-simulator-blocked");
    expect(presentation?.chipLabel).toBe(RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL);
  });

  it("Rehearsal + Simulator shows rehearsal incomplete chip", () => {
    const presentation = resolveAlertInboxCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-simulator");
    expect(presentation?.chipLabel).toBe(RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL);
  });

  it("Rehearsal + Real shows practice chip", () => {
    const presentation = resolveAlertInboxCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Real",
      effectiveWorkingCareerRehearsalDoor: "rehearsal",
    });

    expect(presentation?.cellId).toBe("rehearsal-real-practice");
    expect(presentation?.chipLabel).toBe(RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL);
  });

  it("skips honesty on sample workspace", () => {
    expect(
      resolveAlertInboxCareerHonesty({
        workingDesk: true,
        isSample: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("detects backend rehearsal title prefix", () => {
    expect(alertTitleShowsRehearsalHonesty(`${ALERT_INBOX_REHEARSAL_TITLE_PREFIX}Cost spike`)).toBe(
      true,
    );
    expect(alertTitleShowsRehearsalHonesty("Cost spike")).toBe(false);
  });

  it("does not overlay on Guided desk", () => {
    expect(
      resolveAlertInboxCareerHonesty({
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
