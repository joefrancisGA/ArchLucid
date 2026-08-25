import { describe, expect, it } from "vitest";

import {
  resolveAdvisoryScheduleCreateChecklistEmphasizedStepId,
  resolveAdvisoryScheduleCreateChecklistSteps,
} from "@/lib/advisory-schedule-create-checklist";

describe("resolveAdvisoryScheduleCreateChecklistSteps", () => {
  it("emphasizes review before frequency", () => {
    expect(
      resolveAdvisoryScheduleCreateChecklistEmphasizedStepId({
        reviewConfigured: false,
        frequencyConfigured: false,
        scheduleSaved: false,
      }),
    ).toBe("review");
  });
});
