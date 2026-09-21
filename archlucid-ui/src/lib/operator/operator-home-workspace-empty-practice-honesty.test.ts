import { describe, expect, it } from "vitest";

import {
  shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty,
} from "@/lib/operator/operator-home-workspace-empty-practice-honesty";

describe("operator-home-workspace-empty-practice-honesty", () => {
  it("shows practice honesty only in Working mode with Practice door selected", () => {
    expect(
      shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty({
        workingMode: true,
        selectedDoor: "rehearsal",
      }),
    ).toBe(true);

    expect(
      shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty({
        workingMode: true,
        selectedDoor: "career",
      }),
    ).toBe(false);

    expect(
      shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty({
        workingMode: false,
        selectedDoor: "rehearsal",
      }),
    ).toBe(false);
  });
});
