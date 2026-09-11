import { describe, expect, it } from "vitest";

import {
  DIGEST_REHEARSAL_BODY_DISCLAIMER,
  DIGEST_REHEARSAL_SUBJECT_PREFIX,
  resolveDigestBodyDisclaimer,
  resolveDigestRowLabel,
  resolveDigestSubjectPrefix,
} from "@/lib/digest/digest-career-honesty";
import {
  RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
  RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
} from "@/lib/runs/run-status-badge-career-honesty";

describe("digest-career-honesty (CG-037)", () => {
  it("Career + Real has no digest row label", () => {
    expect(
      resolveDigestRowLabel({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBeNull();
  });

  it("Career + Simulator shows career blocked row label", () => {
    expect(
      resolveDigestRowLabel({
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "career",
      })?.rowLabel,
    ).toBe(RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL);
  });

  it("Rehearsal + Simulator shows rehearsal incomplete row label", () => {
    expect(
      resolveDigestRowLabel({
        workingDesk: true,
        structuralExecutionMode: "Simulator",
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      })?.rowLabel,
    ).toBe(RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL);
  });

  it("Rehearsal + Real shows practice row label", () => {
    expect(
      resolveDigestRowLabel({
        workingDesk: true,
        structuralExecutionMode: "Real",
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      })?.rowLabel,
    ).toBe(RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL);
  });

  it("prefixes subject only when every committed run requires honesty", () => {
    expect(resolveDigestSubjectPrefix({ committedRunRequiresHonesty: [true, true] })).toBe(
      DIGEST_REHEARSAL_SUBJECT_PREFIX,
    );
    expect(resolveDigestSubjectPrefix({ committedRunRequiresHonesty: [true, false] })).toBe("");
    expect(resolveDigestSubjectPrefix({ committedRunRequiresHonesty: [] })).toBe("");
  });

  it("adds body disclaimer when any committed run requires honesty", () => {
    expect(resolveDigestBodyDisclaimer({ committedRunRequiresHonesty: [true, false] })).toBe(
      DIGEST_REHEARSAL_BODY_DISCLAIMER,
    );
    expect(resolveDigestBodyDisclaimer({ committedRunRequiresHonesty: [false] })).toBeNull();
  });
});
