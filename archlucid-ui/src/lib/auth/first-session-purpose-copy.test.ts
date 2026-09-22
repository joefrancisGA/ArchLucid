import { describe, expect, it } from "vitest";

import {
  FIRST_SESSION_PURPOSE_LIVE_CTA,
  FIRST_SESSION_PURPOSE_TRAINING_CTA,
  firstSessionPurposeCopyDoesNotCollideWithReviewDoors,
} from "@/lib/auth/first-session-purpose-copy";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";

describe("first-session-purpose-copy", () => {
  it("keeps Training distinct from Record and Practice labels", () => {
    expect(FIRST_SESSION_PURPOSE_TRAINING_CTA).not.toBe(WORKING_REHEARSAL_DOOR_LABEL);
    expect(FIRST_SESSION_PURPOSE_TRAINING_CTA).not.toBe(WORKING_CAREER_DOOR_LABEL);
    expect(firstSessionPurposeCopyDoesNotCollideWithReviewDoors()).toBe(true);
  });

  it("does not describe live workspace with sample or demo wording", () => {
    expect(FIRST_SESSION_PURPOSE_LIVE_CTA.toLowerCase()).not.toContain("sample");
    expect(FIRST_SESSION_PURPOSE_LIVE_CTA.toLowerCase()).not.toContain("demo");
  });
});
