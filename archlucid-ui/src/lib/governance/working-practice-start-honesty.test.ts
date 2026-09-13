import { describe, expect, it } from "vitest";

import {
  shouldShowWorkingPracticeStartHonesty,
  WORKING_PRACTICE_START_HONESTY_SENTENCE,
} from "@/lib/governance/working-practice-start-honesty";

describe("working practice start honesty (IH-026)", () => {
  it("shows when Working Practice door is selected", () => {
    expect(
      shouldShowWorkingPracticeStartHonesty({
        workingMode: true,
        selectedDoor: "rehearsal",
      }),
    ).toBe(true);
  });

  it("hides for Record door and Guided mode", () => {
    expect(
      shouldShowWorkingPracticeStartHonesty({
        workingMode: true,
        selectedDoor: "career",
      }),
    ).toBe(false);
    expect(
      shouldShowWorkingPracticeStartHonesty({
        workingMode: false,
        selectedDoor: "rehearsal",
      }),
    ).toBe(false);
  });

  it("names Practice and rejects Record-complete screenshot language", () => {
    expect(WORKING_PRACTICE_START_HONESTY_SENTENCE).toMatch(/Practice/i);
    expect(WORKING_PRACTICE_START_HONESTY_SENTENCE).toMatch(/Record-complete/i);
  });
});
