import { describe, expect, it } from "vitest";

import {
  ERROR_RECOVERY_RETRY_NO_POSTURE_CHANGE,
  ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH,
  ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_TITLE,
  resolveErrorRecoveryCareerHonesty,
} from "@/lib/error-recovery/error-recovery-career-honesty";

describe("error-recovery-career-honesty (CG-096)", () => {
  it("returns generic retry honesty on Working when stamp is Career + Real", () => {
    const presentation = resolveErrorRecoveryCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Real",
      stampedWorkingCareerRehearsalDoor: "career",
      liveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.kind).toBe("generic-retry");
    expect(presentation?.body).toBe(ERROR_RECOVERY_RETRY_NO_POSTURE_CHANGE);
  });

  it("uses stamped honesty for Career door on Simulator", () => {
    const presentation = resolveErrorRecoveryCareerHonesty({
      workingDesk: true,
      structuralExecutionMode: "Simulator",
      stampedWorkingCareerRehearsalDoor: "career",
      liveWorkingCareerRehearsalDoor: "career",
    });

    expect(presentation?.kind).toBe("stamped");
    expect(presentation?.title).toBe(ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_TITLE);
    expect(presentation?.body).toContain(ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH);
  });

  it("returns null outside Working desk", () => {
    expect(
      resolveErrorRecoveryCareerHonesty({
        workingDesk: false,
        structuralExecutionMode: "Simulator",
        stampedWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });
});
