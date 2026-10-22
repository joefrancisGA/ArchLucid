import { describe, expect, it } from "vitest";

import {
  resolveExecDigestScheduleEmphasizedStepId,
  resolveExecDigestScheduleSteps,
} from "@/lib/exec-digest-schedule-checklist";

describe("exec-digest-schedule-checklist", () => {
  it("marks steps complete from schedule readiness input", () => {
    expect(
      resolveExecDigestScheduleSteps({
        recipientsConfigured: true,
        scheduleConfigured: true,
        deliveryEnabled: false,
      }),
    ).toEqual([
      { id: "recipients", label: "Add sponsor digest recipients", complete: true },
      { id: "schedule", label: "Set weekly send day and time", complete: true },
      { id: "enable", label: "Save schedule and enable delivery", complete: false },
    ]);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveExecDigestScheduleEmphasizedStepId({
        recipientsConfigured: false,
        scheduleConfigured: true,
        deliveryEnabled: false,
      }),
    ).toBe("recipients");
  });
});
