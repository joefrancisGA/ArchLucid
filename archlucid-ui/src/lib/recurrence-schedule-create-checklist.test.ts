import { describe, expect, it } from "vitest";

import {
  resolveRecurrenceScheduleCreateEmphasizedStepId,
  resolveRecurrenceScheduleCreateSteps,
} from "@/lib/recurrence-schedule-create-checklist";

describe("resolveRecurrenceScheduleCreateSteps", () => {
  it("emphasizes review before cadence", () => {
    expect(
      resolveRecurrenceScheduleCreateEmphasizedStepId({
        reviewConfigured: false,
        cadenceConfigured: false,
        scheduleSaved: false,
      }),
    ).toBe("review");

    expect(
      resolveRecurrenceScheduleCreateSteps({
        reviewConfigured: true,
        cadenceConfigured: false,
        scheduleSaved: false,
      }).find((step) => step.id === "cadence")?.complete,
    ).toBe(false);
  });
});
